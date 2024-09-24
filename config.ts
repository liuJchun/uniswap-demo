import { http } from 'viem'
import { sepolia } from 'viem/chains'
import { createConfig } from 'wagmi'

export const networkConfig = createConfig({
  chains: [sepolia],
  transports: {
    // [mainnet.id]: http(),
    [sepolia.id]: http(),
  },
})

export const chainId = 1686
