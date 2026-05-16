'use client';

import { useEffect, useState } from 'react';

/**
 * Tracks pointer position in element-local normalized coords: [-1, 1] on
 * each axis with the origin at the element's center. Returns {x:0,y:0}
 * before the first mousemove. Re-binds when the target ref changes.
 */
export function useCursor(targetRef: React.RefObject<HTMLElement>) {
  const [pos, setPos] = useState({ x: 0, y: 0 });
  useEffect(() => {
    const el = targetRef.current;
    if (!el) return;
    const onMove = (e: PointerEvent) => {
      const rect = el.getBoundingClientRect();
      const nx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const ny = ((e.clientY - rect.top) / rect.height) * 2 - 1;
      setPos({ x: nx, y: -ny });
    };
    const onLeave = () => setPos({ x: 0, y: 0 });
    el.addEventListener('pointermove', onMove);
    el.addEventListener('pointerleave', onLeave);
    return () => {
      el.removeEventListener('pointermove', onMove);
      el.removeEventListener('pointerleave', onLeave);
    };
  }, [targetRef]);
  return pos;
}
