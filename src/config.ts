import { createConfig, http, WagmiProvider, WagmiConfig } from 'wagmi'
// import { createConfig} from '@wagmi/core'
import { mainnet, polygon, Chain } from 'wagmi/chains'
import { getDefaultConnectors } from '@0xsequence/kit-connectors'

const chains = [mainnet, polygon] as [Chain, ...Chain[]]
  
const projectAccessKey = 'AQAAAAAAAAgNjIRFEAG0m21hy3oLEEKQLpo'

const connectors = getDefaultConnectors({
  walletConnectProjectId: '645c9423a4429b484eef3d148855b5e4',
  defaultChainId: 137,
  appName: 'demo app',
  projectAccessKey,
  
})

const transports: any = {}

chains.forEach(chain => {
  transports[chain.id] = http()
})

const config = createConfig({
  transports,
  chains,
  connectors
})

export {config}