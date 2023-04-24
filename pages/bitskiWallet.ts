import { Chain, Wallet } from "@rainbow-me/rainbowkit";
import {
  Ethereum,
  InjectedConnector,
  InjectedConnectorOptions,
} from "@wagmi/core";
import { AuthenticationStatus, Bitski } from "bitski";

export interface BitskiWalletOptions {
  bitski: Bitski;
  chains: Chain[];
}

class BitskiConnector extends InjectedConnector {
  bitski: Bitski;
  windowEthereum?: Ethereum;
  prevWindowEthereum?: Ethereum;

  constructor({
    bitski,
    chains,
    options: options_,
  }: {
    bitski: Bitski;
    chains?: Chain[];
    options?: InjectedConnectorOptions;
  }) {
    let previousProvider: any;
    let currentProvider: any;

    if (typeof window !== "undefined" && (window.ethereum as any)) {
      previousProvider = window.ethereum;
    }

    if (
      typeof window !== "undefined" &&
      (window.ethereum as any) &&
      (window.ethereum as any).isBitski
    ) {
      currentProvider = window.ethereum;
    }

    if (typeof window !== "undefined" && !currentProvider) {
      currentProvider = bitski.getProvider();
    }

    const options = {
      shimDisconnect: true,
      getProvider: () => currentProvider,
      ...options_,
    };

    super({ chains, options });

    this.windowEthereum = currentProvider;
    this.prevWindowEthereum = previousProvider;
    this.bitski = bitski;
  }

  private ejectProvider() {
    if (typeof window === "undefined") return;

    global.window.ethereum = this.prevWindowEthereum;
    this.windowEthereum = this.prevWindowEthereum;
    this.prevWindowEthereum = undefined;
  }

  async connect({ chainId }: { chainId?: number } = {}) {
    const status = await this.bitski.getAuthStatus();
    if (status !== AuthenticationStatus.Connected) {
      await this.bitski.signIn();
    }

    const result = super.connect({ chainId });
    return result;
  }

  async disconnect(): Promise<void> {
    this.ejectProvider();

    await super.disconnect();
    await this.bitski?.signOut();
    await this.bitski?.getAuthStatus();
  }
}

export const bitskiWallet = ({
  bitski,
  chains,
  ...options
}: BitskiWalletOptions & InjectedConnectorOptions): Wallet => ({
  id: "bitski",
  name: "Bitski",
  installed:
    !!bitski ||
    (typeof window !== "undefined" &&
      typeof window.ethereum !== "undefined" &&
      ((window.ethereum as any).isBitski === true ||
        !!window.ethereum.providers?.find((p: any) => p.isBitski === true))),
  iconUrl: "https://cdn.bitskistatic.com/docs-web/bitskiWallet.svg",
  iconBackground: "#fff",
  downloadUrls: {
    browserExtension:
      "https://chrome.google.com/webstore/detail/bitski/feejiigddaafeojfddjjlmfkabimkell",
    ios: "https://apps.apple.com/us/app/bitski-wallet/id1587199538",
  },
  createConnector: () => ({
    connector: new BitskiConnector({
      bitski,
      chains,
      options,
    }),
  }),
});
