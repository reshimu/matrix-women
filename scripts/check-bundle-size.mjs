#!/usr/bin/env node
// Fails if a published library artifact regresses past its budget. Run after
// `pnpm build:library` (dist/lib/ must already exist). See RISK_PERFORMANCE_AUDIT.md
// for the numbers this was calibrated against and why.
import { readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'

const DIST_LIB = 'dist/lib'

const BUDGETS = [
  { name: 'index.js', match: (file) => file === 'index.js', maxBytes: 5 * 1024, required: true },
  { name: 'react.js', match: (file) => file === 'react.js', maxBytes: 30 * 1024, required: true },
  { name: 'react.css', match: (file) => file === 'react.css', maxBytes: 20 * 1024, required: true },
  {
    name: 'shared chunk',
    match: (file) => file.endsWith('.js') && file !== 'index.js' && file !== 'react.js',
    maxBytes: 2 * 1024,
    required: false,
  },
]

let files
try {
  files = readdirSync(DIST_LIB)
} catch {
  console.error(`Could not read "${DIST_LIB}" -- run "pnpm build:library" first.`)
  process.exit(1)
}

let failed = false

for (const budget of BUDGETS) {
  const matches = files.filter(budget.match)

  if (matches.length === 0 && budget.required) {
    console.error(`[FAIL] Expected to find "${budget.name}" in ${DIST_LIB}, but it's missing.`)
    failed = true
    continue
  }

  for (const file of matches) {
    const { size } = statSync(join(DIST_LIB, file))
    const withinBudget = size <= budget.maxBytes
    const status = withinBudget ? 'OK  ' : 'FAIL'
    console.log(
      `[${status}] ${file}: ${(size / 1024).toFixed(2)} kB (budget: ${(budget.maxBytes / 1024).toFixed(0)} kB)`,
    )
    if (!withinBudget) failed = true
  }
}

if (failed) {
  console.error(
    '\nBundle size budget exceeded. Reduce the bundle, or if the growth is deliberate ' +
      'and justified, raise the budget in scripts/check-bundle-size.mjs with a comment ' +
      'explaining why, and update RISK_PERFORMANCE_AUDIT.md to match.',
  )
  process.exit(1)
}

console.log('\nAll bundle size budgets passed.')
