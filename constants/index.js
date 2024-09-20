//
import QUOTERV2_ABI from "./abi/abi-quoter-v2.json";
import V3SWAPROUTER_ABI from "./abi/abi-swap-router.json";
import V3FACTORY_ABI from "./abi/abi-v3-factory.json";
import V3POOL_ABI from "./abi/abi-v3-pool.json";

//tokens
import ERC20_ABI from "./abi/abi-erc20.json";
import WETH_ABI from "./abi/abi-weth.json";
import { abi as WORLDCOIN_ABI } from "./abi/WorldCoin.json";
import { abi as NonfungiblePositionManagerABI } from "./abi/PositionManager.json";

//lib
// import {computePoolAddress } from "@uniswap/v3-sdk";

//
import {
  SwapQuoter,
  QuoteOptions,
  SwapRouter,
  SwapOptions,
  Trade,
  tradeComparator,
  BestTradeOptions,
  NonfungiblePositionManager,
  FeeAmount,
  TICK_SPACINGS,
  Pool,
  encodeSqrtRatioX96,
  Position,
  computePoolAddress,
  TickMath,
} from "@uniswap/v3-sdk";

const JSON_RPC_URL = process.env.NEXT_PUBLIC_JSON_RPC_URL;

export {
  JSON_RPC_URL,
  //
  QUOTERV2_ABI,
  V3SWAPROUTER_ABI,
  V3FACTORY_ABI,
  V3POOL_ABI,
  //tokens
  ERC20_ABI,
  WETH_ABI,
  // self token
  WORLDCOIN_ABI,
  //quoter
  SwapQuoter,
  QuoteOptions,
  // //swapRouter
  SwapRouter,
  SwapOptions,
  // //trade
  Trade,
  tradeComparator,
  BestTradeOptions,
  //
  NonfungiblePositionManagerABI,
  //utils
  computePoolAddress,
  NonfungiblePositionManager,
  FeeAmount,
  TICK_SPACINGS,
  Pool,
  encodeSqrtRatioX96,
  Position,
  TickMath,
};
