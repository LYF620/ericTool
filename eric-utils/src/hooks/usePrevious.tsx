import { useRef, useEffect } from 'react'

// 保存上一次渲染的值
export function usePrevious(value) {
  const ref = useRef()

  useEffect(() => {
    ref.current = value
  })

  return ref.current
}
