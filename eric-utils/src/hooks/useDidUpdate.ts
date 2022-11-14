import { useRef, useEffect } from 'react'

// 模拟didUpdate 生命周期 ， 只在更新时运行的effect
export function useDidUpdate(fn, inputs?: any[]) {
  const didMountRef = useRef(false)

  useEffect(() => {
    if (didMountRef.current) {
      fn()
    } else {
      didMountRef.current = true
    }
  }, inputs)
}
