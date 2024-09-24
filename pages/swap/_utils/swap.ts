import { Percent, Token, TradeType } from '@uniswap/sdk-core'
import { SwapRouter, Trade } from '@uniswap/v3-sdk'
import { getProvider } from './quote'

export async function handleSwap(swapTrade: Trade<Token, Token, TradeType>) {
  const singer = getProvider().getSigner()
  const address = await singer.getAddress()

  const { calldata } = SwapRouter.swapCallParameters([swapTrade], {
    slippageTolerance: new Percent(Number(0.5) * 100, 10_000),
    deadline: Math.floor(Date.now() / 1000) + 60 * 20,
    // recipient: (isNativeEth(state.outputTokenAddress)
    //   ? process.env.NEXT_PUBLIC_ROUTER_CONTRACT_ADDRESS
    //   : address) as string,
    recipient: address,
  })
  // const swapContract = new ethers.Contract(
  //   '0x4Aa4fAf0e9421E4057506a80A2a8513f42295eC5',
  //   SwapRouterABI.abi,
  //   singer
  // )
  singer.sendTransaction({
    data: calldata,
    to: '0x4Aa4fAf0e9421E4057506a80A2a8513f42295eC5',
    from: address,
    maxFeePerGas: 100000000000,
    maxPriorityFeePerGas: 100000000000,
  })
}
