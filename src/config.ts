import { createConfig, http, WagmiProvider, WagmiConfig } from 'wagmi'
// import { createConfig} from '@wagmi/core'
import { mainnet, arbitrumSepolia, Chain } from 'wagmi/chains'
import { KitProvider, getKitConnectWallets } from '@0xsequence/kit';
import { getDefaultWaasConnectors } from '@0xsequence/kit-connectors';

// const projectAccessKey = 'AQAAAAAAAAgNjIRFEAG0m21hy3oLEEKQLpo'
const appleRedirectURI = 'http://' + window.location.host

const chains: any = [mainnet, arbitrumSepolia];

const projectAccessKey = process.env.REACT_APP_PROJECTACCESSKEY!;
const waasConfigKey =  process.env.REACT_APP_waasConfigKey!;
const googleClientId =  process.env.REACT_APP_googleClientId!;
const appleClientId =  process.env.REACT_APP_appleClientId!;

const connectors = [
  ...getDefaultWaasConnectors({
    walletConnectProjectId: ENV.walletConnectId,
    defaultChainId: 421614,
    waasConfigKey,
    googleClientId,
    appleClientId,
    appleRedirectURI,
    appName: 'demo app',
    projectAccessKey,
    enableConfirmationModal: false,
  }),
  ...getKitConnectWallets(projectAccessKey, []),
];

const transports: any = {}

chains.forEach((chain: any) => {
  transports[chain.id] = http()
})

const config = createConfig({
  transports,
  chains,
  connectors
})

export {config}