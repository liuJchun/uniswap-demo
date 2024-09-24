import { useState } from 'react'

export function useAccount() {
  const [activeAccount, setActiveAccount] = useState<string>('')

  const reqWallet = async (index: number) => {
    if (!window.ethereum) return console.log('Install MetaMask')
    const accounts = await window.ethereum.request({
      method: 'eth_requestAccounts',
    })
    setActiveAccount(accounts[index])
  }
}
