'use client'

import { waitForTransactionReceipt, writeContract } from '@wagmi/core'
import { createCollectorClient } from '@zoralabs/protocol-sdk'
import { useState } from 'react'
import { useAccount, useChainId, useConfig, usePublicClient } from 'wagmi'

function SuccessView({ explorerLink }: { explorerLink: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
      <h1 className="text-5xl font-normal">Minted 'Crying dolphin'</h1>
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

export function Mint() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [success, setSuccess] = useState<{ explorerLink: string } | null>(null)
  const chainId = useChainId()
  const publicClient = usePublicClient()
  const { address } = useAccount()
  const config = useConfig()

  const handleMint = async () => {
    if (!publicClient || !address) return

    setIsSubmitting(true)

    try {
      const collectorClient = createCollectorClient({
        chainId,
        publicClient,
      })

      const { parameters } = await collectorClient.mint({
        tokenContract: '0x102FA18B93DA2565F3651cfCA14A5CABFCd63081',
        mintType: '1155',
        tokenId: BigInt(1),
        quantityToMint: 1,
        minterAccount: address,
      })

      const hash = await writeContract(config, parameters)

      // Wait for transaction receipt
      const receipt = await waitForTransactionReceipt(config, {
        hash,
      })

      const explorerLink = `https://sepolia.basescan.org/tx/${receipt.transactionHash}`
      setSuccess({ explorerLink })
    } catch (error) {
      console.error('Error minting:', error)
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
          src="https://magic.decentralized-content.com/ipfs/bafybeic42mop5763cu6f4uvmqfyc42u2ppjyr4qrl3ptmtmp433w56qlaq"
          alt="Crying Dolphin"
          className="w-full h-auto rounded-lg"
        />
        <div className="text-2xl font-medium text-center">Crying dolphin</div>
        <button
          onClick={handleMint}
          disabled={isSubmitting}
          className="w-full bg-black text-white py-3 rounded-lg hover:bg-gray-800 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Minting...' : 'Mint'}
        </button>
      </div>
    </div>
  )
}
