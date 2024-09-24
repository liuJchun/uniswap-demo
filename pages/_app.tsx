import '@/styles/globals.css'
import { QueryClientProvider } from '@tanstack/react-query'
import type { AppProps } from 'next/app'

import ConnectInfo from '@/common/components/connect-info'
import { networkConfig } from '@/config'
import { Container } from '@mui/material'
import { QueryClient } from '@tanstack/react-query'
import { WagmiProvider } from 'wagmi'

const queryClient = new QueryClient()

export default function App({ Component, pageProps }: AppProps) {
  return (
    <WagmiProvider config={networkConfig}>
      <QueryClientProvider client={queryClient}>
        <Container sx={{ marginTop: 5 }}>
          <ConnectInfo />
          <Component {...pageProps} />
        </Container>
      </QueryClientProvider>
    </WagmiProvider>
  )
}
