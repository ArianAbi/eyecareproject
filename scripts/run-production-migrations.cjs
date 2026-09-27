const { spawnSync } = require('node:child_process')

if (process.env.VERCEL_ENV === 'production') {
  const command = process.platform === 'win32' ? 'npx.cmd' : 'npx'
  const result = spawnSync(command, ['prisma', 'migrate', 'deploy'], { stdio: 'inherit' })
  if (result.error) throw result.error
  if (result.status !== 0) process.exit(result.status ?? 1)
}
