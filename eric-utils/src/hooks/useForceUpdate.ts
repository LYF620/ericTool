import { useCallback, useReducer, useState } from 'react'

// 自创版本
export const useForceUpdate = () => {
  const [, updateState] = useState(undefined)
  const forceUpdate = useCallback(() => updateState({}), [])

  return forceUpdate
}

// react官网版本
export const useForceUpdateByEric = () => {
  const [, forceUpdate] = useReducer((x) => x + 1, 0)

  return forceUpdate
}
