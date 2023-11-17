import * as esbuild from 'esbuild'

await esbuild.build({
  entryPoints: ['/dist/global-analytics-lib.js'],
  bundle: true,
  minify: true,
  outfile: '/dist/global-analytics-lib.min.js',
})