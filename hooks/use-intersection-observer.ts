"use client"

import { useEffect, useState, useRef } from "react"

interface UseIntersectionObserverOptions {
  threshold?: number | number[]
  root?: Element | null
  rootMargin?: string
  triggerOnce?: boolean
}

export function useIntersectionObserver(options?: UseIntersectionObserverOptions) {
  const [isInView, setIsInView] = useState(false)
  const [hasBeenInView, setHasBeenInView] = useState(false) // Tracks if the element has ever been in view
  const ref = useRef<HTMLDivElement | null>(null)

  // Extraemos los valores primitivos de `options` para usarlos como
  // dependencias. Antes se pasaba el objeto entero (`options`) y, como los
  // llamantes crean un objeto nuevo en cada render, el efecto se re-ejecutaba
  // en cada render y recreaba el IntersectionObserver constantemente.
  const threshold = options?.threshold ?? 0.1
  const root = options?.root ?? null
  const rootMargin = options?.rootMargin ?? "0px"
  const triggerOnce = options?.triggerOnce ?? false
  // `threshold` puede ser un array: lo serializamos para una comparación estable.
  const thresholdKey = Array.isArray(threshold) ? threshold.join(",") : threshold

  useEffect(() => {
    const element = ref.current
    if (!element) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true)
          setHasBeenInView(true)
          if (triggerOnce) {
            observer.unobserve(element)
          }
        } else if (!triggerOnce) {
          setIsInView(false)
        }
      },
      {
        threshold,
        root,
        rootMargin,
      },
    )

    observer.observe(element)

    return () => {
      observer.disconnect()
    }
    // `threshold`/`root`/`rootMargin`/`triggerOnce` son primitivos (o
    // serializados), así que el observer solo se recrea si cambian de verdad.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [thresholdKey, root, rootMargin, triggerOnce])

  return { ref, isInView, hasBeenInView }
}
