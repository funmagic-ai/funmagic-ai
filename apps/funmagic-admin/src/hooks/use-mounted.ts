'use client';

import { useEffect, useState } from 'react';

/**
 * Hook to track whether the component has mounted.
 * Useful for avoiding hydration mismatches when rendering
 * client-only content that differs from server rendering.
 */
export function useMounted() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);
  return mounted;
}
