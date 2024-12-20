'use client'

import { Buy } from '@/app/components/Buy'
import { Create } from '@/app/components/Create'
import { Mint } from '@/app/components/Mint'
import { Nav } from '@/app/components/Nav'
import { Sell } from '@/app/components/Sell'
import { useState } from 'react'

export default function Home() {
  const [selectedView, setSelectedView] = useState<string>('')

  const renderContent = () => {
    switch (selectedView) {
      case 'create':
        return <Create />
      case 'mint':
        return <Mint />
      case 'buy':
        return <Buy />
      case 'sell':
        return <Sell />
      default:
        return null
    }
  }

  return (
    <div className="min-h-screen w-full max-w-screen-2xl mx-auto">
      <div className="grid md:grid-cols-[minmax(300px,500px)_1fr]">
        <aside className="md:fixed md:w-[500px] pt-20">
          <div className=" p-4">
            <Nav onSelectView={setSelectedView} selectedView={selectedView} />
          </div>
        </aside>

        <main className="md:col-start-2 pt-20">
          <div className="p-6 pt-20">
            <div className=" p-4 pb-16">{renderContent()}</div>
          </div>
        </main>
      </div>
    </div>
  )
}
