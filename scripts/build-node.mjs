import * as esbuild from 'esbuild'
import { spawnSync } from 'node:child_process'
import fs from 'node:fs/promises'
import path from 'node:path'

const root = process.cwd()
const dist = path.join(root, 'dist')
const deployManifest = path.join(root, 'server/package.json')

await fs.mkdir(dist, { recursive: true })

const cssStubPlugin = {
  name: 'css-stub',
  setup(build) {
    build.onLoad({ filter: /\.css$/ }, () => ({
      contents: 'export default {}',
      loader: 'js',
    }))
  },
}

const shared = {
  bundle: true,
  platform: 'node',
  target: 'node20',
  // CJS avoids Express/debug dynamic-require issues under Node ESM
  format: 'cjs',
  sourcemap: false,
  minify: true,
  logLevel: 'info',
  jsx: 'automatic',
  plugins: [cssStubPlugin],
}

await esbuild.build({
  ...shared,
  entryPoints: [path.join(root, 'server/index.ts')],
  outfile: path.join(dist, 'server.js'),
})

await esbuild.build({
  ...shared,
  entryPoints: [path.join(root, 'tests/pvt/run.ts')],
  outfile: path.join(dist, 'pvt.js'),
  // jsdom must stay external (ships CSS/data files that break when bundled)
  external: ['jsdom'],
})

// Deploy manifest: runtime deps only (see server/package.json)
const manifest = JSON.parse(await fs.readFile(deployManifest, 'utf8'))
// Bundled server.js / pvt.js are CJS; force CommonJS for the deploy folder
manifest.type = 'commonjs'
await fs.writeFile(
  path.join(dist, 'package.json'),
  `${JSON.stringify(manifest, null, 2)}\n`,
)

const depCount = Object.keys(manifest.dependencies ?? {}).length
if (depCount > 0) {
  console.log('Installing production dependencies into dist/ …')
  const install = spawnSync(
    'npm',
    ['install', '--omit=dev', '--no-fund', '--no-audit'],
    {
      cwd: dist,
      stdio: 'inherit',
      shell: process.platform === 'win32',
      env: {
        ...process.env,
        NODE_ENV: 'production',
      },
    },
  )

  if (install.status !== 0) {
    process.exit(install.status ?? 1)
  }
  console.log('dist/node_modules installed from server/package.json (omit=dev)')
} else {
  console.log('No runtime dependencies in server/package.json — skipping dist npm install')
}

console.log(
  'Node bundles written to dist/server.js and dist/pvt.js (minified, no maps)',
)
