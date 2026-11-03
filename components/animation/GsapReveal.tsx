'use client';

import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';

interface GsapRevealProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  duration?: number;
  yOffset?: number;
  stagger?: number;
}

export function GsapReveal({
  children,
  className,
  delay = 0,
  duration = 0.8,
  yOffset = 30,
}: GsapRevealProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Respect user's motion preference
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }

    const element = containerRef.current;
    if (!element) return;

    gsap.fromTo(
      element,
      {
        opacity: 0,
        y: yOffset,
      },
      {
        opacity: 1,
        y: 0,
        duration,
        delay,
        ease: 'power3.out',
      }
    );
  }, [delay, duration, yOffset]);

  return (
    <div ref={containerRef} className={className}>
      {children}
    </div>
  );
}
