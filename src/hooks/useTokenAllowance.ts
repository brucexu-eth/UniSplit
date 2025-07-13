import { useReadContract } from 'wagmi'
import { ERC20_ABI } from '../contracts/erc20'
import { CONTRACTS } from '../config/constants'

interface UseTokenAllowanceParams {
  token: string
  owner?: string | undefined
  enabled?: boolean
}

export function useTokenAllowance({ token, owner, enabled = true }: UseTokenAllowanceParams) {
  const { data: allowance = BigInt(0), ...rest } = useReadContract({
    address: token as `0x${string}`,
    abi: ERC20_ABI,
    functionName: 'allowance',
    args: owner && CONTRACTS.BILL_SPLITTER
      ? [owner as `0x${string}`, CONTRACTS.BILL_SPLITTER as `0x${string}`]
      : undefined,
    query: {
      enabled: enabled && !!owner && !!token,
    },
  })

  return {
    allowance,
    ...rest,
  }
}