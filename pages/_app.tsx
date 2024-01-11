import "@rainbow-me/rainbowkit/styles.css";

import {
  connectorsForWallets,
  RainbowKitProvider,
  Locale,
  Chain,
} from "@rainbow-me/rainbowkit";
import {
  injectedWallet,
  metaMaskWallet,
  coinbaseWallet,
} from "@rainbow-me/rainbowkit/wallets";
import { useRouter } from "next/router";
import type { AppProps } from "next/app";
import { configureChains, createConfig, WagmiConfig } from "wagmi";
import { mainnet, polygon, optimism, arbitrum, base, zora } from "viem/chains";
import { publicProvider } from "wagmi/providers/public";
import { bitskiWallet } from "@bitski/wagmi-connector";

const modular: Chain = {
  id: 20482050,
  name: "Modular",
  network: "modular",
  iconUrl: "https://example.com/icon.svg",
  iconBackground: "#fff",
  nativeCurrency: {
    decimals: 18,
    name: "Modular",
    symbol: "UNKNOWN",
  },
  rpcUrls: {
    public: { http: ["https://testnet-explorer.modulargames.xyz"] },
    default: { http: ["https://testnet-explorer.modulargames.xyz"] },
  },
  blockExplorers: {
    default: { name: "SnowTrace", url: "https://snowtrace.io" },
    etherscan: { name: "SnowTrace", url: "https://snowtrace.io" },
  },
  contracts: {
    multicall3: {
      address: "0xca11bde05977b3631167028862be2a173976ca11",
      blockCreated: 11_907_934,
    },
  },
  testnet: false,
};

const { chains, publicClient, webSocketPublicClient } = configureChains(
  [mainnet, polygon, optimism, arbitrum, base, zora, modular],
  [publicProvider()]
);

/*
 * Replace the clientId and callbackUrl with your own.
 * You can get credential info by creating an account at https://developer.bitski.com.
 */

const APP_ID = "e14c1eff-03a9-42ba-b5ea-133063bb3524";

const network = {
  rpcUrl: "https://testnet-explorer.modulargames.xyz",
  chainId: 20482050,
};

const callbackURL = "http://localhost:3000/callback.html";

const connectors = connectorsForWallets([
  {
    groupName: "Recommended",
    wallets: [
      bitskiWallet({
        options: { appId: APP_ID, bitskiOptions: { network, callbackURL } },
        chains,
      }),
    ],
  },
  {
    groupName: "Other Wallets",
    wallets: [
      injectedWallet({ chains }),
      metaMaskWallet({ chains, projectId: "YOUR_PROJECT_ID" }),
      coinbaseWallet({ appName: "YOUR_APP_NAME", chains }),
    ],
  },
]);

const wagmiConfig = createConfig({
  autoConnect: true,
  connectors,
  publicClient,
  webSocketPublicClient,
});

const demoAppInfo = {
  appName: "Rainbowkit Demo",
};

function MyApp({ Component, pageProps }: AppProps) {
  const { locale } = useRouter() as { locale: Locale };
  return (
    <WagmiConfig config={wagmiConfig}>
      <RainbowKitProvider appInfo={demoAppInfo} chains={chains} locale={locale}>
        <Component {...pageProps} />
      </RainbowKitProvider>
    </WagmiConfig>
  );
}

export default MyApp;
