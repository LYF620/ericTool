import { useState, useCallback } from 'react'

// 封装可以响应变化的ref
export function useCallbackRef() {
  const [rect, setRect] = useState(null)
  const ref = useCallback((node) => {
    if (node !== null) {
      setRect(node.getBoundingClientRect())
    }
  }, [])
  return [rect, ref]
}
