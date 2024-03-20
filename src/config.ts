// eslint-disable-next-line @typescript-eslint/ban-ts-comment
//@ts-nocheck
import { http } from "wagmi";
import { createConfig } from "@wagmi/core";
import { mainnet, arbitrumSepolia } from "wagmi/chains";
import { getKitConnectWallets } from "@0xsequence/kit";
import { getDefaultWaasConnectors } from "@0xsequence/kit-connectors";

// const projectAccessKey = 'AQAAAAAAAAgNjIRFEAG0m21hy3oLEEKQLpo'
const appleRedirectURI = "http://" + window.location.host;

const chains: any = [mainnet, arbitrumSepolia];

console.log(process.env);

const projectAccessKey = process.env.REACT_APP_PROJECTACCESSKEY!;
const waasConfigKey = process.env.REACT_APP_WAASCONFIGKEY!;
const googleClientId = process.env.REACT_APP_GOOGLECLIENTID!;
const appleClientId = process.env.REACT_APP_APPLECLIENTID!;

const connectors = [
  ...getDefaultWaasConnectors({
    walletConnectProjectId: process.env.REACT_APP_WALLETCONNECTID!,
    defaultChainId: 421614,
    waasConfigKey,
    googleClientId,
    appleClientId,
    appleRedirectURI,
    appName: "demo app",
    projectAccessKey,
    enableConfirmationModal: false,
  }),
  ...getKitConnectWallets(projectAccessKey, []),
];

const transports: any = {};

chains.forEach((chain: any) => {
  transports[chain.id] = http();
});

const config = createConfig({
  transports,
  chains,
  connectors,
});

export { config };
