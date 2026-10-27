#!/usr/bin/env node

import { register } from 'node:module'

import { execute } from '@oclif/core'

// Framework imports from installed metamodel packages resolve to the CLI's
// own instances (see src/support/framework-hooks.ts).
register('../lib/support/framework-hooks.js', import.meta.url)

await execute({ development: true, dir: import.meta.url })
