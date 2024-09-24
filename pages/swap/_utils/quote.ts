import { fromReadableAmount } from '@/common/utils/conversion'
import { chainId } from '@/config'
import { Currency, CurrencyAmount, Token, TradeType } from '@uniswap/sdk-core'
import IUniswapV3PoolABI from '@uniswap/v3-core/artifacts/contracts/interfaces/IUniswapV3Pool.sol/IUniswapV3Pool.json'
import { FeeAmount, Pool, Route, SwapQuoter } from '@uniswap/v3-sdk'
import { Address } from 'cluster'
import { ethers } from 'ethers'
import { AbiCoder } from 'ethers/lib/utils'
import { unionBy } from 'lodash'
type QuoteParamsType = {
  tokenIn: Token
  tokenOut: Token
  amount: string
  tradeType: TradeType
}

export type TokenInfo = {
  decimals: number
  id: any
  name: string
  symbol: string
}

type PoolType = {
  id: Address
  token0: TokenInfo
  token1: TokenInfo
  feeTier: FeeAmount
}

// {
//   mainnet:'0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
//   ropsten:'0xc778417E063141139Fce010982780140Aa0cD5Ab',
//   rinkeby:'0xc778417E063141139Fce010982780140Aa0cD5Ab',
//   goerli:'0xB4FBF271143F4FBf7B91A5ded31805e42b2208d6',
//   kovan:'0xd0A1E359811322d97991E03f863a0C30C2cF029C'
// }

const BaseTokens: Token[] = [
  new Token(chainId, '0x4200000000000000000000000000000000000006', 18, 'WETH'),
]
export function getProvider() {
  return new ethers.providers.Web3Provider(window.ethereum)
}

export const getPoolInfoByAddress = async (poolAddress: any) => {
  const poolContract = new ethers.Contract(
    poolAddress,
    IUniswapV3PoolABI.abi as any,
    getProvider().getSigner()
  )

  const [fee, liquidity, slot0] = await Promise.all([
    poolContract.fee(),
    poolContract.liquidity(),
    poolContract.slot0(),
  ])
  return { fee, liquidity, slot0 }
}

const addressEquals = (address1: string, address2: string) => {
  return ethers.utils.getAddress(address1) === ethers.utils.getAddress(address2)
}

async function getCandidatePools(
  pools: PoolType[],
  tokenIn: Token,
  tokenOut: Token
): Promise<Pool[]> {
  const poolDirect = pools.filter(el => {
    return (
      (addressEquals(el.token0.id, tokenIn.address) &&
        addressEquals(el.token1.id, tokenOut.address)) ||
      (addressEquals(el.token1.id, tokenIn.address) &&
        addressEquals(el.token0.id, tokenOut.address))
    )
  })

  const matchBaseTokenPools = BaseTokens.flatMap(baseToken => {
    return pools.filter(pool => {
      return (
        (addressEquals(pool.token0.id, baseToken.address) ||
          addressEquals(pool.token0.id, tokenIn.address) ||
          addressEquals(pool.token0.id, tokenOut.address)) &&
        (addressEquals(pool.token1.id, baseToken.address) ||
          addressEquals(pool.token1.id, tokenIn.address) ||
          addressEquals(pool.token1.id, tokenOut.address))
      )
    })
  })

  // getPoolInfoByAddress

  return await Promise.all(
    [...poolDirect, ...matchBaseTokenPools].map(async el => {
      // sqrtPriceX96
      // tick
      const { slot0, liquidity, fee } = await getPoolInfoByAddress(el.id)
      return new Pool(
        new Token(chainId, el.token0.id, +el.token0.decimals),
        new Token(chainId, el.token1.id, +el.token1.decimals),
        fee,
        slot0[0],
        liquidity,
        slot0[1]
      )
    })
  )
}

function buildRoute(pools: Pool[], tokenIn: Currency, tokenOut: Currency) {
  return new Route(pools, tokenIn, tokenOut)
}

function computeAllRoutes<TPool extends Pool>(
  tokenIn: Token,
  tokenOut: Token,
  pools: Pool[],
  maxHops = 2
) {
  const poolsUsed = Array<boolean>(pools.length).fill(false)

  const routes: Route<Currency, Currency>[] = []

  const computeRoutes = (
    tokenIn: Token,
    tokenOut: Token,
    currentRoute: Pool[],
    poolsUsed: boolean[],
    _previousTokenOut?: Token
  ) => {
    if (currentRoute.length > maxHops) {
      return
    }

    if (currentRoute.length > 0 && currentRoute[currentRoute.length - 1].involvesToken(tokenOut)) {
      routes.push(buildRoute([...currentRoute], tokenIn, tokenOut))
      return
    }

    for (let i = 0; i < pools.length; i++) {
      if (poolsUsed[i]) {
        continue
      }

      const curPool = pools[i]
      const previousTokenOut = _previousTokenOut ? _previousTokenOut : tokenIn

      if (!curPool.involvesToken(previousTokenOut)) {
        continue
      }

      const currentTokenOut = curPool.token0.equals(previousTokenOut)
        ? curPool.token1
        : curPool.token0

      currentRoute.push(curPool)
      poolsUsed[i] = true
      computeRoutes(tokenIn, tokenOut, currentRoute, poolsUsed, currentTokenOut)
      poolsUsed[i] = false
      currentRoute.pop()
    }
  }
  computeRoutes(tokenIn, tokenOut, [], poolsUsed)
  return routes
}

async function getQuoteInfoByRoutes(
  routes: Route<Currency, Currency>[],
  tradeType: TradeType,
  tokenInput: Token,
  amount: string,
  routeLimit: number = 6
) {
  const quoteRoutes = routes.slice(0, routeLimit)

  const getQuote = (route: Route<Currency, Currency>) => {
    return new Promise((resolve, reject) => {
      const { calldata } = SwapQuoter.quoteCallParameters(
        route,
        CurrencyAmount.fromRawAmount(tokenInput, amount),
        tradeType,
        {
          useQuoterV2: true,
        }
      )

      const provider = getProvider()

      provider
        .call({
          // mint chain QuoterV2 测试网 QuoteV2
          to: '0xA3D593033a6a003d6De1DD2f1363C770b990476A',
          data: calldata,
        })
        .then(quoteCallReturnData => {
          // v3-periphery contracts/interfacers/IQuoter.sol
          //   returns (
          //     uint256 amountOut,
          //     uint160 sqrtPriceX96After,
          //     uint32 initializedTicksCrossed,
          //     uint256 gasEstimate
          // );
          const res = new AbiCoder().decode(
            ['uint256', 'uint160', 'uint32', 'uint256'],
            quoteCallReturnData
          )
          resolve({
            route,
            quote: res[0].toString(),
            gasLimit: res[3].toString(),
            sqrtPriceX96After: res[1].toString(),
          })
        })
        .catch(err => {
          reject(err)
        })
    })
  }

  const allSettledRoutes = await Promise.allSettled(quoteRoutes.map(route => getQuote(route)))
  const allComplteds = allSettledRoutes.filter(el => el.status === 'fulfilled').map(el => el.value)

  allComplteds.sort((v2: any, v1: any) => {
    return tradeType === TradeType.EXACT_INPUT
      ? Number(v2.quote) - Number(v1.quote)
      : Number(v1.quote) - Number(v2.quote)
  })

  return {
    bestRouteQuote: allComplteds[allComplteds.length - 1],
    allRoutes: allComplteds,
  }
}

export const handleQuote = async (params: QuoteParamsType) => {
  const { amount, tokenIn, tokenOut, tradeType } = params
  const formatAmount = fromReadableAmount(
    Number(amount),
    tradeType === TradeType.EXACT_INPUT ? tokenIn.decimals : tokenOut.decimals
  )
  // get pools
  const poolIns: Pool[] = await getCandidatePools(await getPools(), tokenIn, tokenOut)
  // get routes
  const routes: Route<Currency, Currency>[] = computeAllRoutes(tokenIn, tokenOut, poolIns)

  // quote
  const data = await getQuoteInfoByRoutes(
    routes,
    tradeType,
    tradeType === TradeType.EXACT_INPUT ? tokenIn : tokenOut,
    formatAmount
  )
  return data
}

export async function getTokens(): Promise<TokenInfo[]> {
  const pools = await getPools()
  const tokens = pools.flatMap((pool: PoolType) => {
    return [pool.token0, pool.token1]
  })
  return unionBy(tokens, 'id')
}

export async function getPools(): Promise<PoolType[]> {
  // const pools = [
  //   {
  //     feeTier: '10000',
  //     id: '0x00f74d4dee3b3a7eba1a7500081c3e2081023b2f',
  //     liquidity: '133745818295335854',
  //     sqrtPrice: '250206315277357881453716595331',
  //     tick: '23000',
  //     token0: {
  //       decimals: '9',
  //       id: '0x7d3429d38425c11d0efada070a63aa60f1979fb1',
  //       name: '진돗개',
  //       symbol: 'JINDO',
  //     },
  //     token1: {
  //       decimals: '18',
  //       id: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
  //       name: 'Wrapped Ether',
  //       symbol: 'WETH',
  //     },
  //   },
  // ]
  const res = await fetch(
    'https://testapi.mintswap.finance/api/v2/pool/list?page=1&size=999999'
  ).then(res => res.json())
  const data = res.data || []
  return data.map((pool: any) => {
    return {
      id: pool.address,
      feeTier: pool.fee,
      token0: {
        decimals: pool.token1_decimals,
        id: pool.token0_address,
        name: pool.token0_name,
        symbol: pool.token0_symbol,
      },
      token1: {
        decimals: pool.token1_decimals,
        id: pool.token1_address,
        name: pool.token1_name,
        symbol: pool.token1_symbol,
      },
    }
  })
}
