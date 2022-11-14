// 使用defineConfig 提供代码提示
import { defineConfig } from 'rollup'
// 允许rollup从json文件导入数据
import json from '@rollup/plugin-json'
// 压缩bundle
import { terser } from 'rollup-plugin-terser'
import { uglify } from 'rollup-plugin-uglify'
// 编译TS
import typescript from 'rollup-plugin-typescript2'

export default defineConfig([
  {
    input: 'src/index.js',
    output: [
      // {
      //   file: 'dist/beforTerseBundle.js',
      //   format: 'iife',
      // },
      // {
      //   dir: 'dist/iife',
      //   format: 'iife',
      //   plugins: [terser()],
      //   inlineDynamicImports: 'dist',
      // },
      // {
      //   dir: 'dist/cjs',
      //   format: 'cjs',
      // },
      {
        dir: 'dist/es',
        format: 'es',
      },
      // {
      //   dir: 'dist/amd',
      //   format: 'amd',
      // },
      // {
      //   file: 'dist/umdBundle.js',
      //   name: 'myUmd',
      //   format: 'umd',
      // },
    ],
    plugins: [
      json(),
      uglify(),
      typescript({
        // 使用tsconfig.json的配置文件
        tsconfig: 'tsconfig.json',
        // 默认声明文件放到一个文件夹中
        useTsconfigDeclarationDir: true,
      }),
    ],
  },
])
