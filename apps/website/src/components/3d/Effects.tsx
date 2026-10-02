'use client';

import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';
import { useAppStore } from '@/lib/store';
import { useEffect, useState } from 'react';

export function Effects() {
  const quality = useAppStore((state) => state.deviceQuality);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;
  if (quality === 'low') return null;

  return (
    <EffectComposer enableNormalPass={false}>
      <Bloom 
        luminanceThreshold={0.5} 
        mipmapBlur 
        intensity={quality === 'high' ? 1.5 : 0.8} 
      />
      <Vignette eskil={false} offset={0.1} darkness={1.1} />
    </EffectComposer>
  );
}
