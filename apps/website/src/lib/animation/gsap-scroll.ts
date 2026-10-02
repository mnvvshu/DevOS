import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useEffect, RefObject } from 'react';

// Only register in browser environment
if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

export function useGsapReveal(
  ref: RefObject<HTMLElement | null>,
  options: {
    y?: number;
    opacity?: number;
    duration?: number;
    delay?: number;
    stagger?: number;
    trigger?: RefObject<HTMLElement | null>;
  } = {}
) {
  useEffect(() => {
    if (!ref.current) return;
    
    // Respect prefers-reduced-motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    const {
      y = 50,
      opacity = 0,
      duration = 1,
      delay = 0,
      stagger = 0,
      trigger = ref
    } = options;

    const element = ref.current;
    const triggerElement = trigger.current || element;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        element.children.length && stagger ? element.children : element,
        {
          y,
          opacity,
        },
        {
          y: 0,
          opacity: 1,
          duration,
          delay,
          stagger,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: triggerElement,
            start: 'top 85%',
            toggleActions: 'play none none reverse',
          },
        }
      );
    }, ref);

    return () => ctx.revert();
  }, [ref, options]);
}
