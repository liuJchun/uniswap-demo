import { toReadableAmount } from '@/common/utils/conversion'
import { chainId } from '@/config'
import { Autocomplete, Box, Button, Input, Stack, TextField } from '@mui/material'
import { Currency, CurrencyAmount, Token, TradeType } from '@uniswap/sdk-core'
import { Route, Trade } from '@uniswap/v3-sdk'
import { round } from 'lodash'
import { useEffect, useState } from 'react'
import { getTokens, handleQuote, TokenInfo } from './_utils/quote'

type SwapInfo = {
  token0: string
  token1: string
  decimals0: number
  decimals1: number
  input0: string
  input1: string
}

type QuoteInfoItem = {
  route: Route<Currency, Currency>
  gasLimit: string
  quote: string
  sqrtPriceX96After: string
}

const filterOptions = (options: any, { inputValue }: any) => {
  return options.filter(
    (option: any) =>
      option.name.toLowerCase().includes(inputValue.toLowerCase()) ||
      option.symbol.toLowerCase().includes(inputValue.toLowerCase())
  )
}

const SwapIndex = () => {
  const [swapTrade, setSwapTrade] = useState<Trade<Token, Token, TradeType>>()

  const [swapInfo, setSwapInfo] = useState<SwapInfo>({
    token0: '',
    token1: '',
    decimals0: 18,
    decimals1: 18,
    input0: '',
    input1: '',
  })

  const [quoteInfo, setQuoteInfo] = useState<{
    bestRouteQuote: QuoteInfoItem
    allRoutes: QuoteInfoItem[]
  }>()

  const [tokenList, setTokenList] = useState<TokenInfo[]>([])

  useEffect(() => {
    ;(async () => {
      const tokenList = await getTokens()
      setTokenList(tokenList)
    })()
  }, [])

  const handleBlurAmount = async (
    tokenIn: Token,
    tokenOut: Token,
    amount: string,
    tradeType: TradeType
  ) => {
    if (!swapInfo.token0 || !swapInfo.token1 || !amount || tradeType === undefined) {
      throw new Error('参数不对')
    }
    const { bestRouteQuote, allRoutes }: any = await handleQuote({
      tokenIn,
      tokenOut,
      amount,
      tradeType,
    })
    setQuoteInfo({ bestRouteQuote, allRoutes })
    console.log('current Quote is:', bestRouteQuote, allRoutes)

    if (!bestRouteQuote) {
      return
    }

    if (tradeType === TradeType.EXACT_INPUT) {
      setSwapInfo((pre: any) => {
        return {
          ...pre,
          input1: round(+toReadableAmount(bestRouteQuote.quote, tokenOut.decimals), 2),
        }
      })
    } else {
      setSwapInfo((pre: any) => {
        return {
          ...pre,
          input0: round(+toReadableAmount(bestRouteQuote.quote, tokenIn.decimals), 2),
        }
      })
    }
    // construct a trade object
    const route = bestRouteQuote.route as any as Route<Currency, Currency>
    // const _pools = route.pools
    const uncheckedTrade = Trade.createUncheckedTrade({
      route,
      inputAmount: CurrencyAmount.fromRawAmount(
        tokenIn,
        tradeType === TradeType.EXACT_INPUT ? amount : bestRouteQuote.quote
      ),
      outputAmount: CurrencyAmount.fromRawAmount(
        tokenOut,
        tradeType === TradeType.EXACT_OUTPUT ? amount : bestRouteQuote.quote
      ),
      tradeType,
    })
    console.log('===current uncheckedTrade is:', uncheckedTrade)
    setSwapTrade(uncheckedTrade as any)
  }

  return (
    <div>
      <h3>Swap Page</h3>

      <h5 style={{ marginTop: 20, marginBottom: 20, textAlign: 'center' }}>
        <span>测试：</span>
      </h5>
      <div>
        <div>
          <span>token0: {swapInfo.token0}</span>
          <span>the balance Of token0: {swapInfo.input0}</span>
        </div>
        <div>
          <span>token1: {swapInfo.token1}</span>
          <span>the balance Of token1: {swapInfo.input1}</span>
        </div>
      </div>

      <Stack spacing={2} marginY={5}>
        <Stack direction={'row'} spacing={2}>
          <label htmlFor="token0">token0</label>
          <Input
            id="token0"
            onChange={e => {
              setSwapInfo((pre: SwapInfo) => {
                return {
                  ...pre,
                  input0: e.target.value,
                }
              })
            }}
            value={swapInfo.input0}
            onBlur={e => {
              setSwapInfo((pre: SwapInfo) => {
                return {
                  ...pre,
                  input0: e.target.value,
                }
              })
              handleBlurAmount(
                new Token(chainId, swapInfo.token0, +swapInfo.decimals0),
                new Token(chainId, swapInfo.token1, +swapInfo.decimals1),
                e.target.value,
                TradeType.EXACT_INPUT
              )
            }}
          />

          <Autocomplete
            sx={{ width: 300 }}
            options={tokenList}
            renderInput={params => <TextField {...params} label="Token0" />}
            getOptionLabel={el => `${el.symbol} (${el.name})`}
            onChange={(e, item) => {
              setSwapInfo((pre: any) => {
                return {
                  ...pre,
                  token0: item?.id || '',
                  decimals0: item?.decimals || 0,
                }
              })
            }}
            filterOptions={filterOptions}
          />
        </Stack>

        <Stack direction={'row'} spacing={2}>
          <label htmlFor="token1">token1</label>
          <Input
            id="token1"
            value={swapInfo.input1}
            onChange={e => {
              setSwapInfo((pre: any) => {
                return {
                  ...pre,
                  input1: e.target.value,
                }
              })
            }}
            onBlur={e => {
              setSwapInfo((pre: any) => {
                return {
                  ...pre,
                  input1: e.target.value,
                }
              })
              handleBlurAmount(
                new Token(chainId, swapInfo.token0, swapInfo.decimals0),
                new Token(chainId, swapInfo.token1, swapInfo.decimals1),
                e.target.value,
                TradeType.EXACT_OUTPUT
              )
            }}
          />
          <Autocomplete
            sx={{ width: 300 }}
            options={tokenList}
            renderInput={params => <TextField {...params} label="Token1" />}
            getOptionLabel={el => `${el.symbol} (${el.name})`}
            onChange={(e, item) => {
              setSwapInfo((pre: any) => {
                return {
                  ...pre,
                  token1: item?.id || '',
                  decimals1: item?.decimals || 0,
                }
              })
            }}
            filterOptions={filterOptions}
          />
        </Stack>
      </Stack>
      <span>pool没有足够的数量会报错</span>

      <Box marginY={10}>
        <p>出价信息</p>
        {quoteInfo?.bestRouteQuote ? (
          <>
            <span>没有匹配到Pool 信息</span>
          </>
        ) : (
          <>
            <p>gas Limit {quoteInfo?.bestRouteQuote?.gasLimit}</p>
            {/* <p>getPriceImpact {getPriceImpact}</p> */}
          </>
        )}
      </Box>

      <Stack spacing={2}>
        {/* <Button variant="contained">获取出价信息</Button> */}
        <Button variant="contained">Swap</Button>
      </Stack>
    </div>
  )
}

export default SwapIndex
