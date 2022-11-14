import { useRef } from 'react'

export type noop = (...args: any[]) => any

// 使用ref记录函数引用，并保持引用地址不变
// 利用ref 实现
// 比较于useCallback,没有闭包，能够获取到最新的state

function usePersistFn<T extends noop>(fn: T) {
  const fnRef = useRef<T>(fn)
  fnRef.current = fn

  const persistFn = useRef<T>()
  if (!persistFn.current) {
    persistFn.current = function (this, ...args) {
      return fnRef.current!.apply(this, args)
    } as T
  }

  return persistFn.current!
}

export default usePersistFn
