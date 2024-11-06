'use client'

import { useIpfsUpload } from '@/app/hooks/useIpfsUpload'
import { usePrivy } from '@privy-io/react-auth'
import { waitForTransactionReceipt, writeContract } from '@wagmi/core'
import { createCreatorClient } from '@zoralabs/protocol-sdk'
import Image from 'next/image'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useAccount, useConfig, usePublicClient } from 'wagmi'

interface FormInputs {
  title: string
  description: string
  image: FileList | null
}

function SuccessView({ explorerLink }: { explorerLink: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
      <h1 className="text-5xl font-normal">Token successfully created!</h1>
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

export function Create() {
  const { authenticated, login } = usePrivy()
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [success, setSuccess] = useState<{ explorerLink: string } | null>(null)

  const { uploadFileToIpfs, uploadJsonToIpfs } = useIpfsUpload()
  const { address } = useAccount()
  const publicClient = usePublicClient()
  const config = useConfig()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormInputs>()

  // Handle image preview
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const onSubmit = async (data: FormInputs) => {
    if (!publicClient || !address || !data.image?.[0]) {
      console.error('Missing required data:', {
        publicClient,
        address,
        image: data.image,
      })
      return
    }

    setIsSubmitting(true)

    try {
      console.log('Uploading with data:', data)

      // 1. Upload image to IPFS
      const imageFile = data.image[0]
      console.log('Uploading image file:', imageFile)
      const imageUrl = await uploadFileToIpfs(imageFile)
      console.log('Image uploaded:', imageUrl)

      // 2. Create and upload metadata
      const metadata = {
        name: data.title,
        description: data.description,
        image: imageUrl,
      }
      console.log('Creating metadata:', metadata)
      const metadataUrl = await uploadJsonToIpfs(metadata, 'metadata.json')
      console.log('Metadata uploaded:', metadataUrl)

      // 3. Create Zora creator client
      const creatorClient = createCreatorClient({
        chainId: publicClient.chain.id,
        publicClient,
      })

      // 4. Prepare contract creation parameters
      const { parameters, contractAddress } = await creatorClient.create1155({
        contract: {
          name: data.title,
          uri: metadataUrl,
        },
        token: {
          tokenMetadataURI: metadataUrl,
        },
        account: address,
      })

      // 5. Execute the contract creation and wait for the transaction
      const hash = await writeContract(config, parameters)

      // 6. Wait for transaction receipt
      const receipt = await waitForTransactionReceipt(config, {
        hash,
      })

      const explorerLink = `https://sepolia.basescan.org/tx/${receipt.transactionHash}`
      setSuccess({ explorerLink })
    } catch (error) {
      console.error('Error creating post:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (success) {
    return <SuccessView explorerLink={success.explorerLink} />
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="max-w-2xl mx-auto p-4">
      <div className="mb-6">
        <div
          className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center cursor-pointer"
          onClick={() => document.getElementById('image-upload')?.click()}
        >
          {imagePreview ? (
            <div className="relative w-full">
              <img
                src={imagePreview}
                alt="Preview"
                className="w-full h-auto rounded-lg"
              />
            </div>
          ) : (
            <div className="py-8 text-gray-500">+ Upload image</div>
          )}
          <input
            id="image-upload"
            type="file"
            accept="image/*"
            className="hidden"
            {...register('image', {
              required: 'Image is required',
              onChange: handleImageChange,
            })}
          />
        </div>
        {errors.image && (
          <span className="text-red-500 text-sm">{errors.image.message}</span>
        )}
      </div>

      <div className="mb-6">
        <input
          type="text"
          placeholder="Post title"
          className="w-full p-2 border border-gray-300 rounded-lg"
          {...register('title', {
            required: 'Title is required',
          })}
        />
        {errors.title && (
          <span className="text-red-500 text-sm">{errors.title.message}</span>
        )}
      </div>

      <div className="mb-6">
        <textarea
          placeholder="Description"
          className="w-full p-2 border border-gray-300 rounded-lg"
          rows={4}
          {...register('description', {
            required: 'Description is required',
          })}
        />
        {errors.description && (
          <span className="text-red-500 text-sm">{errors.description.message}</span>
        )}
      </div>

      <button
        type={authenticated ? 'submit' : 'button'}
        disabled={isSubmitting}
        className="w-full bg-black text-white py-3 rounded-lg hover:bg-gray-800 disabled:bg-gray-400 disabled:cursor-not-allowed"
        onClick={!authenticated ? login : () => {}}
      >
        {isSubmitting ? 'Creating...' : 'Create'}
      </button>
    </form>
  )
}
