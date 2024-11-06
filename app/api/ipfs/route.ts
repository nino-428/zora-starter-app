import { Readable } from 'stream'
import pinataSDK from '@pinata/sdk'
import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

// Initialize Pinata client
const pinata = new pinataSDK(
  process.env.PINATA_API_KEY!,
  process.env.PINATA_SECRET_API_KEY!
)

function bufferToStream(buffer: Buffer): Readable {
  const stream = new Readable()
  stream.push(buffer)
  stream.push(null)
  return stream
}

async function uploadToIPFS(buffer: Buffer, filename: string): Promise<string> {
  const fileStream = bufferToStream(buffer)
  const options = {
    pinataMetadata: { name: filename },
    pinataOptions: { cidVersion: 1 as const },
  }

  try {
    const result = await pinata.pinFileToIPFS(fileStream, options)
    return `ipfs://${result.IpfsHash}`
  } catch (error) {
    console.error('Failed to upload to IPFS:', error)
    throw new Error('Failed to upload file.')
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get the form data from the request
    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded.' }, { status: 400 })
    }

    // Convert File to Buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Check file size (2GB limit)
    const maxSize = 2000 * 1024 * 1024 // 2GB in bytes
    if (buffer.length > maxSize) {
      return NextResponse.json({ error: 'File size exceeds 2GB limit.' }, { status: 400 })
    }

    const ipfsUrl = await uploadToIPFS(buffer, file.name)

    return NextResponse.json({ url: ipfsUrl }, { status: 200 })
  } catch (error) {
    console.error('Error uploading file:', error)
    return NextResponse.json({ error: 'Failed to upload file to IPFS.' }, { status: 500 })
  }
}
