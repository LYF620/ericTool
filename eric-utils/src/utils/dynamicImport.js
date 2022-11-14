// rollup会将动态导入创建一个单独的块
export default function () {
  import('./dynamicSource.js').then(({ default: dynamic }) =>
    console.log(dynamic)
  )
}
