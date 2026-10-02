'use client'

import { Canvas, useFrame } from '@react-three/fiber'
import { Environment, Stars, RoundedBox, Text, Float } from '@react-three/drei'
import { useState, useEffect } from 'react'
import ParticleField from './ParticleField'

// Minimal CameraRig in case a standalone one isn't available
const CameraRig = ({ children }: { children: React.ReactNode }) => {
  return <group>{children}</group>
}

export default function HeroScene() {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  return (
    <div className="h-full w-full absolute inset-0 -z-10">
      <Canvas camera={{ position: [0, 0, 8], fov: 45 }}>
        <color attach="background" args={['#050505']} />
        
        <ambientLight intensity={0.5} color="#60a5fa" />
        <pointLight position={[10, 10, 10]} intensity={1} color="#3b82f6" />
        <pointLight position={[-10, -10, -10]} intensity={0.5} color="#60a5fa" />

        <CameraRig>
          <Float speed={2} rotationIntensity={0.5} floatIntensity={1}>
            <group position={[0, 0, 0]}>
              <RoundedBox args={[4, 2.5, 0.2]} radius={0.1} smoothness={4}>
                <meshStandardMaterial color="#1e293b" roughness={0.2} metalness={0.8} />
              </RoundedBox>
              
              <mesh position={[0, 0, 0.11]}>
                <planeGeometry args={[3.8, 2.3]} />
                <meshBasicMaterial color="#0f172a" />
              </mesh>

              <Text
                position={[-1.7, 0.8, 0.12]}
                fontSize={0.15}
                color="#60a5fa"
                anchorX="left"
                anchorY="top"
                font="https://fonts.gstatic.com/s/firamono/v14/N0bX2SlFPv1weGeLZDtgJv7S.woff"
              >
                {`> DevOS initializing...
> Loading core modules [OK]
> Establishing AI connection [OK]
> System ready.
> _`}
              </Text>
            </group>
          </Float>

          <ParticleField count={isMobile ? 100 : 300} />
          
          <Stars 
            radius={50} 
            depth={50} 
            count={isMobile ? 1000 : 3000} 
            factor={4} 
            saturation={0} 
            fade 
            speed={1} 
          />
        </CameraRig>
        
        <Environment preset="night" />
      </Canvas>
    </div>
  )
}
