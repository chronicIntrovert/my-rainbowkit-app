import { Chain, Wallet } from "@rainbow-me/rainbowkit";
import {
  Ethereum,
  InjectedConnector,
  InjectedConnectorOptions,
} from "@wagmi/core";
import { AuthenticationStatus, Bitski, ProviderOptions } from "bitski";

export interface WaasWalletOptions {
  bitski: Bitski;
  chains: Chain[];
  loginHint: string;
  providerConfig: ProviderOptions;
}

class WaasConnector extends InjectedConnector {
  bitski: Bitski;
  windowEthereum?: Ethereum;
  prevWindowEthereum?: Ethereum;
  providerConfig?: ProviderOptions;
  loginHint?: string;

  constructor({
    bitski,
    chains,
    loginHint,
    providerConfig,
    options: options_,
  }: {
    bitski: Bitski;
    chains?: Chain[];
    loginHint: string;
    providerConfig: ProviderOptions;
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
      currentProvider = bitski.getProvider(providerConfig);
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
    this.providerConfig = providerConfig;
    this.loginHint = loginHint;
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
      await this.bitski.start({
        login_hint: this.loginHint,
        prompt: "login",
      });
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

export const waasWallet = ({
  bitski,
  chains,
  loginHint,
  providerConfig,
  ...options
}: WaasWalletOptions & InjectedConnectorOptions): Wallet => ({
  id: "desolaris",
  name: "Desolaris",
  installed:
    !!bitski ||
    (typeof window !== "undefined" &&
      typeof window.ethereum !== "undefined" &&
      ((window.ethereum as any).isBitski === true ||
        !!window.ethereum.providers?.find((p: any) => p.isBitski === true))),
  iconUrl: "./desolaris.svg",
  iconBackground: "#fff",
  downloadUrls: {
    browserExtension:
      "https://chrome.google.com/webstore/detail/bitski/feejiigddaafeojfddjjlmfkabimkell",
    ios: "https://apps.apple.com/us/app/bitski-wallet/id1587199538",
  },
  createConnector: () => ({
    connector: new WaasConnector({
      bitski,
      chains,
      loginHint,
      providerConfig,
      options,
    }),
  }),
});
