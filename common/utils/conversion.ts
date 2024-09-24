import JSBI from 'jsbi'
import { round } from 'lodash'

export function getPriceImpact(priceX96Before: string, priceX96After: string) {
  const extraDigits = JSBI.exponentiate(JSBI.BigInt(10), JSBI.BigInt(4))
  const result = JSBI.divide(
    JSBI.subtract(JSBI.BigInt(priceX96After), JSBI.BigInt(priceX96Before)),
    JSBI.divide(JSBI.BigInt(priceX96Before), extraDigits)
  )
  return round(Math.abs(Number(result.toString()) / 100), 2)
}

export function fromReadableAmount(amount: number, decimals: number): string {
  const extraDigits = Math.pow(10, countDecimals(amount))
  const adjustedAmount = round(amount * extraDigits)
  return JSBI.divide(
    JSBI.multiply(
      JSBI.BigInt(adjustedAmount),
      JSBI.exponentiate(JSBI.BigInt(10), JSBI.BigInt(decimals))
    ),
    JSBI.BigInt(extraDigits)
  ).toString()
}

function countDecimals(x: number) {
  if (Math.floor(x) === x) {
    return 0
  }
  return x.toString().split('.')[1].length || 0
}

export function toReadableAmount(rawAmount: string, decimals: number): string {
  if (rawAmount.length > decimals) {
    return rawAmount.slice(0, -decimals) + '.' + rawAmount.slice(-decimals)
  } else {
    const suppleZero = '0'.repeat(decimals - rawAmount.length)
    return '0.' + suppleZero + rawAmount.slice(-decimals)
  }
}
