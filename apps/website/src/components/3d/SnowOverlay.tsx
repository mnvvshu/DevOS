'use client'

import { Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import { SnowParticles } from '@/components/3d/CatModel'

export default function SnowOverlay() {
  return (
    <div className="fixed inset-0 z-50 pointer-events-none">
      <Canvas
        camera={{ position: [0, 2, 5], fov: 60 }}
        style={{ width: '100%', height: '100%' }}
        gl={{ alpha: true, antialias: false }}
      >
        <Suspense fallback={null}>
          <SnowParticles count={150} />
        </Suspense>
      </Canvas>
    </div>
  )
}
