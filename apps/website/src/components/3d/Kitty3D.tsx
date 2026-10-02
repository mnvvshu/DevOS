'use client'

import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

interface KittyProps {
  focusTarget: 'email' | 'password' | 'none'
  isShaking: boolean
  isHappy: boolean
}

export function Kitty3D({ focusTarget, isShaking, isHappy }: KittyProps) {
  const groupRef = useRef<THREE.Group>(null)
  const headRef = useRef<THREE.Group>(null)
  const leftEyeRef = useRef<THREE.Mesh>(null)
  const rightEyeRef = useRef<THREE.Mesh>(null)
  const leftEyelidRef = useRef<THREE.Mesh>(null)
  const rightEyelidRef = useRef<THREE.Mesh>(null)
  const pencilRef = useRef<THREE.Group>(null)
  const leftPawRef = useRef<THREE.Group>(null)
  const rightPawRef = useRef<THREE.Group>(null)
  const tailRef = useRef<THREE.Mesh>(null)

  const shakeTime = useRef(0)
  const happyTime = useRef(0)

  // Materials
  const materials = useMemo(() => ({
    body: new THREE.MeshStandardMaterial({ color: '#f0e6ff', roughness: 0.4, metalness: 0.1 }),
    dark: new THREE.MeshStandardMaterial({ color: '#2a2035', roughness: 0.5, metalness: 0.1 }),
    accent: new THREE.MeshStandardMaterial({ color: '#8b5cf6', roughness: 0.3, metalness: 0.2 }),
    white: new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.3, metalness: 0.05 }),
    nose: new THREE.MeshStandardMaterial({ color: '#ff9eb8', roughness: 0.4, metalness: 0 }),
    pencilWood: new THREE.MeshStandardMaterial({ color: '#d4a574', roughness: 0.6, metalness: 0 }),
    pencilTip: new THREE.MeshStandardMaterial({ color: '#1a1a2e', roughness: 0.3, metalness: 0 }),
    pencilBody: new THREE.MeshStandardMaterial({ color: '#8b5cf6', roughness: 0.3, metalness: 0.1 }),
    eyelid: new THREE.MeshStandardMaterial({ color: '#e0d6f0', roughness: 0.4, metalness: 0.1 }),
  }), [])

  useFrame((state, delta) => {
    if (!groupRef.current || !headRef.current) return

    const t = state.clock.elapsedTime

    // Gentle body bob
    groupRef.current.position.y = Math.sin(t * 1.5) * 0.03

    // Tail wag
    if (tailRef.current) {
      tailRef.current.rotation.z = Math.sin(t * 3) * 0.3
    }

    // Head shake on error
    if (isShaking) {
      shakeTime.current += delta * 12
      headRef.current.rotation.y = Math.sin(shakeTime.current) * 0.4 * Math.max(0, 1 - shakeTime.current * 0.1)
      if (shakeTime.current > 3) shakeTime.current = 0
    } else {
      shakeTime.current = 0
      // Head follows pencil target
      const targetY = focusTarget === 'email' ? -0.15 : focusTarget === 'password' ? 0.15 : 0
      headRef.current.rotation.y = THREE.MathUtils.lerp(headRef.current.rotation.y, targetY, delta * 3)
    }

    // Happy bounce
    if (isHappy) {
      happyTime.current += delta * 8
      groupRef.current.position.y += Math.abs(Math.sin(happyTime.current)) * 0.15
    } else {
      happyTime.current = 0
    }

    // Eye closing for password
    const eyesClosed = focusTarget === 'password'
    const eyelidTarget = eyesClosed ? 1 : 0

    if (leftEyelidRef.current && rightEyelidRef.current) {
      const currentScale = leftEyelidRef.current.scale.y
      const newScale = THREE.MathUtils.lerp(currentScale, eyelidTarget, delta * 5)
      leftEyelidRef.current.scale.y = newScale
      rightEyelidRef.current.scale.y = newScale
    }

    // Pencil/paw pointing
    if (pencilRef.current) {
      let targetRotZ = 0.3 // Default resting
      let targetPosX = 0.55

      if (focusTarget === 'email') {
        targetRotZ = -0.6
        targetPosX = 0.7
      } else if (focusTarget === 'password') {
        targetRotZ = 0.1
        targetPosX = 0.7
      }

      pencilRef.current.rotation.z = THREE.MathUtils.lerp(pencilRef.current.rotation.z, targetRotZ, delta * 4)
      pencilRef.current.position.x = THREE.MathUtils.lerp(pencilRef.current.position.x, targetPosX, delta * 4)
    }

    // Paw covering eyes for password
    if (leftPawRef.current && rightPawRef.current) {
      const pawTargetY = eyesClosed ? 0.45 : 0.1
      const pawTargetX = eyesClosed ? 0.15 : 0.35
      const rPawTargetX = eyesClosed ? -0.15 : -0.35

      leftPawRef.current.position.y = THREE.MathUtils.lerp(leftPawRef.current.position.y, pawTargetY, delta * 4)
      leftPawRef.current.position.x = THREE.MathUtils.lerp(leftPawRef.current.position.x, pawTargetX, delta * 4)
      rightPawRef.current.position.y = THREE.MathUtils.lerp(rightPawRef.current.position.y, pawTargetY, delta * 4)
      rightPawRef.current.position.x = THREE.MathUtils.lerp(rightPawRef.current.position.x, rPawTargetX, delta * 4)
    }
  })

  return (
    <group ref={groupRef} position={[0, -0.3, 0]} scale={1.2}>
      {/* Body */}
      <mesh position={[0, -0.3, 0]} material={materials.body}>
        <capsuleGeometry args={[0.35, 0.3, 8, 16]} />
      </mesh>

      {/* Head */}
      <group ref={headRef} position={[0, 0.25, 0]}>
        <mesh material={materials.body}>
          <sphereGeometry args={[0.32, 16, 16]} />
        </mesh>

        {/* Ears */}
        <mesh position={[-0.2, 0.28, 0]} rotation={[0, 0, -0.3]} material={materials.body}>
          <coneGeometry args={[0.12, 0.22, 4]} />
        </mesh>
        <mesh position={[-0.17, 0.26, 0]} rotation={[0, 0, -0.3]} material={materials.accent}>
          <coneGeometry args={[0.07, 0.15, 4]} />
        </mesh>
        <mesh position={[0.2, 0.28, 0]} rotation={[0, 0, 0.3]} material={materials.body}>
          <coneGeometry args={[0.12, 0.22, 4]} />
        </mesh>
        <mesh position={[0.17, 0.26, 0]} rotation={[0, 0, 0.3]} material={materials.accent}>
          <coneGeometry args={[0.07, 0.15, 4]} />
        </mesh>

        {/* Eyes */}
        <mesh ref={leftEyeRef} position={[-0.1, 0.05, 0.28]} material={materials.dark}>
          <sphereGeometry args={[0.055, 12, 12]} />
        </mesh>
        <mesh position={[-0.08, 0.065, 0.31]} material={materials.white}>
          <sphereGeometry args={[0.02, 8, 8]} />
        </mesh>
        <mesh ref={rightEyeRef} position={[0.1, 0.05, 0.28]} material={materials.dark}>
          <sphereGeometry args={[0.055, 12, 12]} />
        </mesh>
        <mesh position={[0.12, 0.065, 0.31]} material={materials.white}>
          <sphereGeometry args={[0.02, 8, 8]} />
        </mesh>

        {/* Eyelids (scale up to close) */}
        <mesh ref={leftEyelidRef} position={[-0.1, 0.08, 0.29]} scale={[1, 0, 1]} material={materials.eyelid}>
          <sphereGeometry args={[0.065, 12, 6]} />
        </mesh>
        <mesh ref={rightEyelidRef} position={[0.1, 0.08, 0.29]} scale={[1, 0, 1]} material={materials.eyelid}>
          <sphereGeometry args={[0.065, 12, 6]} />
        </mesh>

        {/* Nose */}
        <mesh position={[0, -0.04, 0.32]} material={materials.nose}>
          <sphereGeometry args={[0.03, 8, 8]} />
        </mesh>

        {/* Mouth */}
        <mesh position={[0, -0.08, 0.3]} material={materials.dark} scale={[1, 0.3, 1]}>
          <sphereGeometry args={[0.03, 8, 8]} />
        </mesh>

        {/* Whiskers (thin cylinders) */}
        {[-1, 1].map((side) => (
          <group key={side}>
            <mesh position={[side * 0.15, -0.02, 0.3]} rotation={[0, 0, side * 0.1]}>
              <cylinderGeometry args={[0.003, 0.003, 0.2, 4]} />
              <meshStandardMaterial color="#9ca3af" />
            </mesh>
            <mesh position={[side * 0.14, -0.05, 0.3]} rotation={[0, 0, side * 0.2]}>
              <cylinderGeometry args={[0.003, 0.003, 0.18, 4]} />
              <meshStandardMaterial color="#9ca3af" />
            </mesh>
          </group>
        ))}
      </group>

      {/* Left Paw (covers eyes during password) */}
      <group ref={leftPawRef} position={[0.35, 0.1, 0.2]}>
        <mesh material={materials.body}>
          <sphereGeometry args={[0.1, 8, 8]} />
        </mesh>
        {/* Paw pads */}
        <mesh position={[0, 0, 0.08]} material={materials.nose} scale={[0.6, 0.6, 0.3]}>
          <sphereGeometry args={[0.06, 6, 6]} />
        </mesh>
      </group>

      {/* Right Paw (holds pencil) */}
      <group ref={rightPawRef} position={[-0.35, 0.1, 0.2]}>
        <mesh material={materials.body}>
          <sphereGeometry args={[0.1, 8, 8]} />
        </mesh>
        <mesh position={[0, 0, 0.08]} material={materials.nose} scale={[0.6, 0.6, 0.3]}>
          <sphereGeometry args={[0.06, 6, 6]} />
        </mesh>
      </group>

      {/* Pencil */}
      <group ref={pencilRef} position={[0.55, 0.15, 0.15]} rotation={[0, 0, 0.3]}>
        {/* Pencil body */}
        <mesh rotation={[0, 0, Math.PI / 2]} material={materials.pencilBody}>
          <cylinderGeometry args={[0.025, 0.025, 0.45, 6]} />
        </mesh>
        {/* Pencil tip */}
        <mesh position={[0.25, 0, 0]} rotation={[0, 0, -Math.PI / 2]} material={materials.pencilTip}>
          <coneGeometry args={[0.025, 0.08, 6]} />
        </mesh>
        {/* Pencil eraser */}
        <mesh position={[-0.24, 0, 0]} material={materials.nose}>
          <sphereGeometry args={[0.028, 6, 6]} />
        </mesh>
      </group>

      {/* Tail */}
      <mesh ref={tailRef} position={[0, -0.4, -0.3]} rotation={[0.5, 0, 0]} material={materials.accent}>
        <capsuleGeometry args={[0.04, 0.35, 6, 8]} />
      </mesh>

      {/* Feet */}
      <mesh position={[-0.15, -0.65, 0.1]} material={materials.body}>
        <sphereGeometry args={[0.08, 8, 8]} />
      </mesh>
      <mesh position={[0.15, -0.65, 0.1]} material={materials.body}>
        <sphereGeometry args={[0.08, 8, 8]} />
      </mesh>
    </group>
  )
}
