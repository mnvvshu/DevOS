'use client'

import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

interface CatModelProps {
  focusTarget: 'email' | 'password' | 'none'
  isShaking: boolean
  isHappy: boolean
  walkProgress: number
}

export function CatModel({ focusTarget, isShaking, isHappy, walkProgress }: CatModelProps) {
  const groupRef = useRef<THREE.Group>(null)
  const bodyRef = useRef<THREE.Group>(null)
  const headRef = useRef<THREE.Group>(null)
  const legFLRef = useRef<THREE.Group>(null)
  const legFRRef = useRef<THREE.Group>(null)
  const legBLRef = useRef<THREE.Group>(null)
  const legBRRef = useRef<THREE.Group>(null)
  const tailRef = useRef<THREE.Group>(null)
  const leftEyelidRef = useRef<THREE.Mesh>(null)
  const rightEyelidRef = useRef<THREE.Mesh>(null)

  const shakeTime = useRef(0)
  const happyBounce = useRef(0)
  const clock = useRef(0)
  const mouse = useRef({ x: 0, y: 0 })

  const mats = useMemo(() => ({
    body: new THREE.MeshStandardMaterial({ color: '#1e293b', roughness: 0.45, metalness: 0.05 }),
    belly: new THREE.MeshStandardMaterial({ color: '#334155', roughness: 0.4 }),
    accent: new THREE.MeshStandardMaterial({ color: '#3b82f6', roughness: 0.3, metalness: 0.1 }),
    eye: new THREE.MeshStandardMaterial({ color: '#60a5fa', roughness: 0.1, emissive: '#3b82f6', emissiveIntensity: 0.5 }),
    pupil: new THREE.MeshStandardMaterial({ color: '#020617', roughness: 0.1 }),
    nose: new THREE.MeshStandardMaterial({ color: '#f472b6', roughness: 0.3 }),
    eyelid: new THREE.MeshStandardMaterial({ color: '#1e293b', roughness: 0.5 }),
    whisker: new THREE.MeshStandardMaterial({ color: '#94a3b8', roughness: 0.5 }),
    paw: new THREE.MeshStandardMaterial({ color: '#0f172a', roughness: 0.4 }),
    earInner: new THREE.MeshStandardMaterial({ color: '#2563eb', roughness: 0.3 }),
  }), [])

  useFrame(({ pointer }, delta) => {
    if (!groupRef.current || !bodyRef.current) return
    mouse.current.x = pointer.x
    mouse.current.y = pointer.y
    clock.current += delta

    const t = clock.current
    const arrived = walkProgress > 0.95
    const ease = 1 - Math.pow(1 - Math.min(walkProgress, 1), 3)

    // Position: walk from far left to stop point
    groupRef.current.position.x = THREE.MathUtils.lerp(-4.5, -0.5, ease)

    // Scale: start at 0.4, grow to 1.3 max, then STOP
    const scale = THREE.MathUtils.lerp(0.4, 1.3, ease)
    groupRef.current.scale.setScalar(scale)

    // === LEGS — realistic diagonal gait ===
    if (!arrived) {
      const stride = 0.6
      const speed = 10
      const phase = t * speed
      // Diagonal pairs move together (trot gait)
      const legA = Math.sin(phase) * stride
      const legB = Math.sin(phase + Math.PI) * stride
      if (legFLRef.current) legFLRef.current.rotation.x = legA
      if (legBRRef.current) legBRRef.current.rotation.x = legA * 0.8
      if (legFRRef.current) legFRRef.current.rotation.x = legB
      if (legBLRef.current) legBLRef.current.rotation.x = legB * 0.8

      // Body bounce synced to steps
      bodyRef.current.position.y = Math.abs(Math.sin(phase * 2)) * 0.03
      // Slight spine flex while walking
      bodyRef.current.rotation.z = Math.sin(phase) * 0.02
      bodyRef.current.rotation.y = THREE.MathUtils.lerp(bodyRef.current.rotation.y, -0.2, delta * 3)

      // Head bobs slightly
      if (headRef.current) {
        headRef.current.rotation.x = Math.sin(phase * 2) * 0.04
        headRef.current.rotation.y = THREE.MathUtils.lerp(headRef.current.rotation.y, 0, delta * 3)
      }
    } else {
      // IDLE — legs return to rest
      const restSpeed = delta * 4
      if (legFLRef.current) legFLRef.current.rotation.x = THREE.MathUtils.lerp(legFLRef.current.rotation.x, 0, restSpeed)
      if (legFRRef.current) legFRRef.current.rotation.x = THREE.MathUtils.lerp(legFRRef.current.rotation.x, 0, restSpeed)
      if (legBLRef.current) legBLRef.current.rotation.x = THREE.MathUtils.lerp(legBLRef.current.rotation.x, 0, restSpeed)
      if (legBRRef.current) legBRRef.current.rotation.x = THREE.MathUtils.lerp(legBRRef.current.rotation.x, 0, restSpeed)

      // Breathing
      bodyRef.current.position.y = Math.sin(t * 1.8) * 0.008
      bodyRef.current.rotation.z = 0

      // Face toward form + mouse
      let faceY = 0.15
      if (focusTarget === 'email') faceY = 0.35
      else if (focusTarget === 'password') faceY = 0.4
      faceY += mouse.current.x * 0.12
      bodyRef.current.rotation.y = THREE.MathUtils.lerp(bodyRef.current.rotation.y, faceY, delta * 2)

      // Head follows mouse
      if (headRef.current) {
        headRef.current.rotation.y = THREE.MathUtils.lerp(headRef.current.rotation.y, mouse.current.x * 0.2, delta * 2.5)
        headRef.current.rotation.x = THREE.MathUtils.lerp(headRef.current.rotation.x, -mouse.current.y * 0.1, delta * 2.5)
      }

      // Subtle idle paw shift
      if (legFLRef.current) legFLRef.current.rotation.x = Math.sin(t * 1.5) * 0.02
    }

    // Tail
    if (tailRef.current) {
      const tailSpeed = arrived ? 3 : 5
      const tailAmp = arrived ? 0.35 : 0.5
      tailRef.current.rotation.z = Math.sin(t * tailSpeed) * tailAmp
      tailRef.current.rotation.x = Math.sin(t * tailSpeed * 0.5) * 0.1
    }

    // Blink (every ~3-4s, varies)
    const blinkInterval = 3.2 + Math.sin(t * 0.1) * 0.8
    const blinkPhase = t % blinkInterval
    const eyesClosed = (blinkPhase > blinkInterval - 0.15) || (focusTarget === 'password' && arrived)
    const lidTarget = eyesClosed ? 1.15 : 0
    if (leftEyelidRef.current) leftEyelidRef.current.scale.y = THREE.MathUtils.lerp(leftEyelidRef.current.scale.y, lidTarget, delta * (eyesClosed ? 18 : 8))
    if (rightEyelidRef.current) rightEyelidRef.current.scale.y = THREE.MathUtils.lerp(rightEyelidRef.current.scale.y, lidTarget, delta * (eyesClosed ? 18 : 8))

    // Head shake on error
    if (isShaking) {
      shakeTime.current += delta * 14
      const decay = Math.max(0, 1 - shakeTime.current * 0.12)
      if (headRef.current) headRef.current.rotation.y += Math.sin(shakeTime.current) * 0.6 * decay
      if (shakeTime.current > 4) shakeTime.current = 0
    } else { shakeTime.current = 0 }

    // Happy bounce
    if (isHappy) {
      happyBounce.current += delta * 10
      groupRef.current.position.y = Math.abs(Math.sin(happyBounce.current)) * 0.25 - 0.8
    } else {
      happyBounce.current = 0
      groupRef.current.position.y = -0.8
    }
  })

  return (
    <group ref={groupRef} position={[-4.5, -0.8, 0]}>
      <group ref={bodyRef}>
        {/* Body */}
        <mesh material={mats.body} position={[0, 0.55, 0]} rotation={[0, 0, Math.PI / 2]}>
          <capsuleGeometry args={[0.3, 0.55, 12, 16]} />
        </mesh>
        {/* Chest/belly underside */}
        <mesh material={mats.belly} position={[0.05, 0.42, 0.12]} scale={[0.65, 0.45, 0.5]}>
          <sphereGeometry args={[0.3, 12, 12]} />
        </mesh>

        {/* Head */}
        <group ref={headRef} position={[0.45, 0.8, 0]}>
          {/* Neck */}
          <mesh material={mats.body} position={[-0.12, -0.18, 0]} rotation={[0, 0, 0.25]}>
            <capsuleGeometry args={[0.1, 0.14, 8, 8]} />
          </mesh>
          {/* Head sphere */}
          <mesh material={mats.body}>
            <sphereGeometry args={[0.28, 20, 20]} />
          </mesh>
          {/* Snout - slightly protruding */}
          <mesh material={mats.belly} position={[0, -0.06, 0.22]} scale={[0.7, 0.5, 0.5]}>
            <sphereGeometry args={[0.12, 10, 10]} />
          </mesh>

          {/* Ears - triangular */}
          <mesh position={[-0.15, 0.26, 0]} rotation={[0.1, -0.15, -0.25]} material={mats.body}>
            <coneGeometry args={[0.1, 0.22, 4]} />
          </mesh>
          <mesh position={[-0.13, 0.24, 0.01]} rotation={[0.1, -0.15, -0.25]} material={mats.earInner}>
            <coneGeometry args={[0.055, 0.15, 4]} />
          </mesh>
          <mesh position={[0.15, 0.26, 0]} rotation={[0.1, 0.15, 0.25]} material={mats.body}>
            <coneGeometry args={[0.1, 0.22, 4]} />
          </mesh>
          <mesh position={[0.13, 0.24, 0.01]} rotation={[0.1, 0.15, 0.25]} material={mats.earInner}>
            <coneGeometry args={[0.055, 0.15, 4]} />
          </mesh>

          {/* Eyes */}
          <mesh position={[-0.09, 0.04, 0.24]} material={mats.eye}>
            <sphereGeometry args={[0.055, 14, 14]} />
          </mesh>
          <mesh position={[-0.07, 0.05, 0.28]} material={mats.pupil}>
            <sphereGeometry args={[0.025, 8, 8]} />
          </mesh>
          <mesh position={[0.09, 0.04, 0.24]} material={mats.eye}>
            <sphereGeometry args={[0.055, 14, 14]} />
          </mesh>
          <mesh position={[0.07, 0.05, 0.28]} material={mats.pupil}>
            <sphereGeometry args={[0.025, 8, 8]} />
          </mesh>
          {/* Eye highlights */}
          <mesh position={[-0.065, 0.065, 0.29]}>
            <sphereGeometry args={[0.012, 6, 6]} />
            <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={0.6} />
          </mesh>
          <mesh position={[0.075, 0.065, 0.29]}>
            <sphereGeometry args={[0.012, 6, 6]} />
            <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={0.6} />
          </mesh>
          {/* Eyelids */}
          <mesh ref={leftEyelidRef} position={[-0.09, 0.065, 0.245]} scale={[1, 0, 1]} material={mats.eyelid}>
            <sphereGeometry args={[0.06, 12, 8]} />
          </mesh>
          <mesh ref={rightEyelidRef} position={[0.09, 0.065, 0.245]} scale={[1, 0, 1]} material={mats.eyelid}>
            <sphereGeometry args={[0.06, 12, 8]} />
          </mesh>
          {/* Nose */}
          <mesh position={[0, -0.03, 0.28]} material={mats.nose}>
            <sphereGeometry args={[0.025, 8, 8]} />
          </mesh>
          {/* Mouth line */}
          <mesh position={[0, -0.06, 0.26]} material={mats.pupil} scale={[1, 0.25, 1]}>
            <sphereGeometry args={[0.018, 8, 8]} />
          </mesh>
          {/* Whiskers */}
          {[-1, 1].map(side => (
            <group key={side}>
              <mesh position={[side * 0.14, -0.01, 0.24]} rotation={[0, 0, side * 0.08]} material={mats.whisker}>
                <cylinderGeometry args={[0.002, 0.002, 0.2, 4]} />
              </mesh>
              <mesh position={[side * 0.13, -0.04, 0.24]} rotation={[0, 0, side * 0.15]} material={mats.whisker}>
                <cylinderGeometry args={[0.002, 0.002, 0.18, 4]} />
              </mesh>
              <mesh position={[side * 0.12, -0.065, 0.23]} rotation={[0, 0, side * 0.22]} material={mats.whisker}>
                <cylinderGeometry args={[0.002, 0.002, 0.15, 4]} />
              </mesh>
            </group>
          ))}
        </group>

        {/* === LEGS with joints === */}
        {/* Front Left */}
        <group ref={legFLRef} position={[0.18, 0.22, 0.12]}>
          <mesh material={mats.body} position={[0, -0.08, 0]}>
            <capsuleGeometry args={[0.045, 0.15, 6, 8]} />
          </mesh>
          <mesh position={[0, -0.2, 0.01]} material={mats.body}>
            <capsuleGeometry args={[0.04, 0.1, 6, 8]} />
          </mesh>
          <mesh position={[0.01, -0.28, 0.02]} material={mats.paw}>
            <sphereGeometry args={[0.05, 8, 8]} />
          </mesh>
        </group>
        {/* Front Right */}
        <group ref={legFRRef} position={[0.18, 0.22, -0.12]}>
          <mesh material={mats.body} position={[0, -0.08, 0]}>
            <capsuleGeometry args={[0.045, 0.15, 6, 8]} />
          </mesh>
          <mesh position={[0, -0.2, -0.01]} material={mats.body}>
            <capsuleGeometry args={[0.04, 0.1, 6, 8]} />
          </mesh>
          <mesh position={[0.01, -0.28, -0.02]} material={mats.paw}>
            <sphereGeometry args={[0.05, 8, 8]} />
          </mesh>
        </group>
        {/* Back Left */}
        <group ref={legBLRef} position={[-0.22, 0.22, 0.13]}>
          <mesh material={mats.body} position={[0, -0.06, 0]}>
            <capsuleGeometry args={[0.055, 0.14, 6, 8]} />
          </mesh>
          <mesh position={[-0.01, -0.19, 0.01]} material={mats.body}>
            <capsuleGeometry args={[0.04, 0.12, 6, 8]} />
          </mesh>
          <mesh position={[0, -0.28, 0.02]} material={mats.paw}>
            <sphereGeometry args={[0.055, 8, 8]} />
          </mesh>
        </group>
        {/* Back Right */}
        <group ref={legBRRef} position={[-0.22, 0.22, -0.13]}>
          <mesh material={mats.body} position={[0, -0.06, 0]}>
            <capsuleGeometry args={[0.055, 0.14, 6, 8]} />
          </mesh>
          <mesh position={[-0.01, -0.19, -0.01]} material={mats.body}>
            <capsuleGeometry args={[0.04, 0.12, 6, 8]} />
          </mesh>
          <mesh position={[0, -0.28, -0.02]} material={mats.paw}>
            <sphereGeometry args={[0.055, 8, 8]} />
          </mesh>
        </group>

        {/* Tail - curved */}
        <group ref={tailRef} position={[-0.45, 0.65, 0]}>
          <mesh material={mats.body} position={[-0.05, 0.08, 0]} rotation={[0, 0, 0.9]}>
            <capsuleGeometry args={[0.035, 0.2, 6, 8]} />
          </mesh>
          <mesh material={mats.accent} position={[-0.18, 0.22, 0]} rotation={[0, 0, 1.3]}>
            <capsuleGeometry args={[0.03, 0.15, 6, 8]} />
          </mesh>
          <mesh position={[-0.25, 0.35, 0]} material={mats.accent}>
            <sphereGeometry args={[0.035, 8, 8]} />
          </mesh>
        </group>
      </group>
    </group>
  )
}

// === SNOW with varied sizes ===
export function SnowParticles({ count = 300 }: { count?: number }) {
  const pointsRef = useRef<THREE.Points>(null)
  const bigPointsRef = useRef<THREE.Points>(null)

  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 25
      pos[i * 3 + 1] = Math.random() * 12
      pos[i * 3 + 2] = (Math.random() - 0.5) * 15
    }
    return pos
  }, [count])

  // Bigger flakes (fewer)
  const bigCount = Math.floor(count / 5)
  const bigPositions = useMemo(() => {
    const pos = new Float32Array(bigCount * 3)
    for (let i = 0; i < bigCount; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 20
      pos[i * 3 + 1] = Math.random() * 14
      pos[i * 3 + 2] = (Math.random() - 0.5) * 12
    }
    return pos
  }, [bigCount])

  const velocities = useMemo(() => {
    const vel = new Float32Array(count)
    for (let i = 0; i < count; i++) vel[i] = 0.12 + Math.random() * 0.35
    return vel
  }, [count])

  const bigVelocities = useMemo(() => {
    const vel = new Float32Array(bigCount)
    for (let i = 0; i < bigCount; i++) vel[i] = 0.08 + Math.random() * 0.2
    return vel
  }, [bigCount])

  useFrame((_s, delta) => {
    // Small flakes
    if (pointsRef.current) {
      const pos = pointsRef.current.geometry.attributes.position
      const arr = pos.array as Float32Array
      for (let i = 0; i < count; i++) {
        arr[i * 3 + 1] -= velocities[i] * delta
        arr[i * 3] += Math.sin(arr[i * 3 + 1] * 0.3 + i) * delta * 0.06
        if (arr[i * 3 + 1] < -1) { arr[i * 3 + 1] = 10 + Math.random() * 4; arr[i * 3] = (Math.random() - 0.5) * 25 }
      }
      pos.needsUpdate = true
    }
    // Big flakes
    if (bigPointsRef.current) {
      const pos = bigPointsRef.current.geometry.attributes.position
      const arr = pos.array as Float32Array
      for (let i = 0; i < bigCount; i++) {
        arr[i * 3 + 1] -= bigVelocities[i] * delta
        arr[i * 3] += Math.sin(arr[i * 3 + 1] * 0.2 + i * 2) * delta * 0.1
        if (arr[i * 3 + 1] < -1) { arr[i * 3 + 1] = 12 + Math.random() * 3; arr[i * 3] = (Math.random() - 0.5) * 20 }
      }
      pos.needsUpdate = true
    }
  })

  return (
    <>
      <points ref={pointsRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        </bufferGeometry>
        <pointsMaterial size={0.035} color="#dbeafe" transparent opacity={0.45} sizeAttenuation depthWrite={false} />
      </points>
      <points ref={bigPointsRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[bigPositions, 3]} />
        </bufferGeometry>
        <pointsMaterial size={0.09} color="#ffffff" transparent opacity={0.3} sizeAttenuation depthWrite={false} />
      </points>
    </>
  )
}
