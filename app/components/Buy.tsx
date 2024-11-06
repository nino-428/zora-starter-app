'use client'

import { usePrivy } from '@privy-io/react-auth'
import { waitForTransactionReceipt, writeContract } from '@wagmi/core'
import { createCollectorClient } from '@zoralabs/protocol-sdk'
import { useState } from 'react'
import { useAccount, useChainId, useConfig, usePublicClient } from 'wagmi'

function SuccessView({ explorerLink }: { explorerLink: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
      <h1 className="text-5xl font-normal">Bought 'Locked in bunny'</h1>
      <a
        href={explorerLink}
        target="_blank"
        rel="noopener noreferrer"
        className="text-gray-600 hover:underline text-xl"
      >
        View on Basescan Sepolia ↗
      </a>
    </div>
  )
}

export function Buy() {
  const { authenticated, login } = usePrivy()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [success, setSuccess] = useState<{ explorerLink: string } | null>(null)
  const chainId = useChainId()
  const publicClient = usePublicClient()
  const { address } = useAccount()
  const config = useConfig()

  const handleBuy = async () => {
    if (!publicClient || !address) return

    setIsSubmitting(true)

    try {
      const collectorClient = createCollectorClient({
        chainId,
        publicClient,
      })

      const { parameters } = await collectorClient.buy1155OnSecondary({
        contract: '0x856e194fe4e57FA9762Ac5D90cffdDa962f9F6d2',
        tokenId: BigInt(1),
        quantity: BigInt(1),
        account: address,
      })

      const hash = await writeContract(config, parameters)

      // Wait for transaction receipt
      const receipt = await waitForTransactionReceipt(config, {
        hash,
      })

      const explorerLink = `https://sepolia.basescan.org/tx/${receipt.transactionHash}`
      setSuccess({ explorerLink })
    } catch (error) {
      console.error('Error buying:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (success) {
    return <SuccessView explorerLink={success.explorerLink} />
  }

  return (
    <div className="max-w-2xl mx-auto p-4">
      <div className="flex flex-col items-center gap-8">
        <img
          src="https://magic.decentralized-content.com/ipfs/bafybeigx2wsyqvc5hzft5kcnm7r6mzwurkaovhu5k2pqgwgi6bpebr6fku"
          alt="Locked in bunny"
          className="w-full h-auto "
        />
        <div className="text-2xl font-medium text-center">Locked in bunny</div>
        <button
          onClick={authenticated ? handleBuy : login}
          type={authenticated ? 'button' : 'button'}
          disabled={isSubmitting}
          className="w-full bg-black text-white py-3  hover:bg-gray-800 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Buying...' : !authenticated ? 'Login' : 'Buy on Secondary'}
        </button>
      </div>
    </div>
  )
}
