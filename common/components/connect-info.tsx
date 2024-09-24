import { NoSsr } from '@mui/material'
import { useAccount } from 'wagmi'

const ConnectInfo = () => {
  const { isConnected, chainId, chain, address } = useAccount()
  // console.log(isConnected, 'assss')

  return (
    <NoSsr>
      {/* {isConnected ? (
        <Stack direction={'row'} spacing={5}>
          <span>current address is {address}</span>
          <span>current chainId is {chainId}</span>
        </Stack>
      ) : (
        <Button variant="contained">Connect</Button>
      )} */}
      <button
        onClick={() => {
          window.ethereum.request({ method: 'eth_requestAccounts' })
        }}
      >
        Connect
      </button>
    </NoSsr>
  )
}

export default ConnectInfo
