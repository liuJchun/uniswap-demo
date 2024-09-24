import { createPool } from '@/context'
import { ethers } from 'ethers'
import { useEffect, useState } from 'react'

const NOUFUNGIBLE_POSITION_MANAGER_ADDRESS = process.env.NEXT_PUBLIC_NonfungiblePositionManager

const MAX_FEE_PER_GAS = 100000000000
const MAX_PRIORITY_FEE_PER_GAS = 100000000000
const AddLiquidityIndex = () => {
  // //
  // const doExe = async () => {
  //   const contractData = await readContract();
  //   console.log("````````readContract: ", contractData);

  //   await createPool();
  //   console.log("````````createPool~~~~~~~");
  // };

  // useEffect(() => {
  //   doExe();
  // }, []);

  // const doEvent = async () => {
  //   await onEvent();
  // };

  // useEffect(() => {
  //   doEvent();
  // }, []);
  const [activeAccount, setActiveAccount] = useState('')

  const createPool_ = async () => {
    // const web3modal = new Web3Modal()
    // const connection = await web3modal.connect()
    // const provider = new ethers.providers.Web3Provider(connection)
    const provider = new ethers.providers.Web3Provider(window.ethereum)

    console.log('provider', provider)
    const signer = await provider.getSigner()
    console.log('signer', signer, await signer.getAddress())

    const { calldata } = await createPool()

    console.log('````````````````calldata````````````````````', calldata)
    // const transaction = {
    //   data: calldata,
    //   to: NOUFUNGIBLE_POSITION_MANAGER_ADDRESS,
    // };

    // const tx = await provider.call(transaction);
    const transaction = {
      data: calldata,
      to: NOUFUNGIBLE_POSITION_MANAGER_ADDRESS,
      // value: ethers.utils.parseEther("1"),
      // from: activeAccount,
      // maxFeePerGas: MAX_FEE_PER_GAS,
      // maxPriorityFeePerGas: MAX_PRIORITY_FEE_PER_GAS,
    }
    const signedTx = await signer.sendTransaction(transaction)
    console.log('```````````````tx`````````````````````', signedTx)
  }

  const connectWallet = async () => {
    try {
      // @ts-ignore
      if (!window.ethereum) return console.log('Install MetaMask')
      // @ts-ignore
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts',
      })
      const firstAccount = accounts[0]
      setActiveAccount(firstAccount)
    } catch (error) {
      console.log(error)
    }
  }

  useEffect(() => {
    connectWallet()
  }, [])

  return (
    <div>
      <button onClick={() => connectWallet()}>Connect Wallet</button>
      <h2>{activeAccount}</h2>
      <button onClick={() => createPool_()}>create Pool</button>
    </div>
  )
}

export default AddLiquidityIndex
