import isObject from './isObject'
import getTag from './getTag'

const hasOwnProperty = Object.prototype.hasOwnProperty

function initCloneArray(array) {
  const { length } = array
  // 使用参数的构造函数构建一个新的数组对象
  const result = new array.constructor(length)

  // 对于正则regexObj.exec(str)返回的数组来说，存在index、input、groups属性，所以需要特殊处理
  if (
    length &&
    typeof array[0] === 'string' &&
    hasOwnProperty.call(array, 'index')
  ) {
    result.index = array.index
    result.input = array.input
  }
  return result
}

export function cloneDeep(value) {
  let result
  if (result !== undefined) {
    return result
  }

  if (!isObject(value)) {
    return result
  }

  const isArr = Array.isArray(value)
  // 获取value类型type  [object Object]  [object Array] [object Object]
  const tag = getTag(value)

  if (isArr) {
    result = initCloneArray(value)
    return copyArray(value, result)
  } else {
  }
}
