import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function detectDevice(): 'high' | 'medium' | 'low' {
  if (typeof window === 'undefined') return 'high';

  const userAgent = navigator.userAgent;
  const isMobileDevice = isMobile();
  
  if (isMobileDevice) {
    return 'low';
  }

  // Basic check for low-end devices based on logical processors
  if (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4) {
    return 'medium';
  }

  return 'high';
}

export function isMobile(): boolean {
  if (typeof window === 'undefined') return false;
  
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth < 768;
}
