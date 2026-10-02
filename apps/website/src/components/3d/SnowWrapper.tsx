'use client'

import dynamic from 'next/dynamic'

const SnowOverlayInner = dynamic(() => import('@/components/3d/SnowOverlay'), { ssr: false })

export default function SnowWrapper() {
  return <SnowOverlayInner />
}
