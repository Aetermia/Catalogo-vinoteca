import { useEffect, useRef } from 'react';

/** Bloquea el scroll del body mientras `active` sea true (soporta capas anidadas). */
let locks = 0;
export function useBodyLock(active) {
  useEffect(() => {
    if (!active) return undefined;
    locks += 1;
    document.body.classList.add('no-scroll');
    return () => {
      locks -= 1;
      if (locks <= 0) document.body.classList.remove('no-scroll');
    };
  }, [active]);
}

/** Ejecuta `handler` al presionar Escape. */
export function useEscape(handler, active = true) {
  const ref = useRef(handler);
  ref.current = handler;
  useEffect(() => {
    if (!active) return undefined;
    const onKey = (e) => e.key === 'Escape' && ref.current?.(e);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [active]);
}

/** Lleva el foco al contenedor al montar y lo devuelve al elemento previo al desmontar. */
export function useFocusReturn(active, containerRef) {
  useEffect(() => {
    if (!active) return undefined;
    const previous = document.activeElement;
    containerRef.current?.focus();
    return () => previous?.focus?.();
  }, [active, containerRef]);
}
