'use client';

import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import * as THREE from 'three';

export function CameraRig({ children }: { children?: React.ReactNode }) {
  const groupRef = useRef<THREE.Group>(null);
  const target = new THREE.Vector3();

  useFrame((state) => {
    if (!groupRef.current) return;
    
    const isReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (isReducedMotion) return;

    // Calculate target position based on pointer
    target.set(
      (state.pointer.x * state.viewport.width) / 10,
      (state.pointer.y * state.viewport.height) / 10,
      0
    );

    // Smoothly interpolate the group's position
    groupRef.current.position.lerp(target, 0.05);
    
    // Add subtle rotation
    groupRef.current.rotation.y = THREE.MathUtils.lerp(
      groupRef.current.rotation.y,
      (state.pointer.x * Math.PI) / 20,
      0.05
    );
    groupRef.current.rotation.x = THREE.MathUtils.lerp(
      groupRef.current.rotation.x,
      (-state.pointer.y * Math.PI) / 20,
      0.05
    );
  });

  return <group ref={groupRef}>{children}</group>;
}
