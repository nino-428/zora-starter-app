import type { Metadata } from 'next'
import './globals.css'
import { Footer } from '@/app/components/Footer'
import { Header } from '@/app/components/Header'
import Providers from '@/app/providers'
import localFont from 'next/font/local'

const arialNarrow = localFont({
  src: [
    {
      path: '../public/fonts/arialnarrow.ttf',
      weight: '400',
      style: 'normal',
    },
    {
      path: '../public/fonts/arialnarrow_bold.ttf',
      weight: '700',
      style: 'normal',
    },
    {
      path: '../public/fonts/arialnarrow_italic.ttf',
      weight: '400',
      style: 'italic',
    },
    {
      path: '../public/fonts/arialnarrow_bolditalic.ttf',
      weight: '700',
      style: 'italic',
    },
  ],
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Zora Starter App',
  description: 'Get started with Zora',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={arialNarrow.className}>
        <Providers>
          <Header />
          {children}
          <Footer />
        </Providers>
      </body>
    </html>
  )
}
