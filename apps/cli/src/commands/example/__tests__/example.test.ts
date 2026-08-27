import { runCli } from '../../../test-utils/run-cli.js'

describe('example ls', () => {
  it('lists registered runnables', async () => {
    // The verb was renamed from 'list' in Phase 4 (resource -> verb
    // consistency); the old name must not resolve
    const legacy = await runCli(['example', 'list'])
    expect(legacy.error).toBeDefined()
    const { stdout, error } = await runCli(['example', 'ls'])
    expect(error).toBeUndefined()
    // At least one of the bundled example ids should appear
    expect(stdout).toMatch(/eer-to-rel-small/)
  })

  it('outputs JSON with --json flag', async () => {
    const { stdout, error } = await runCli(['example', 'ls', '--json'])
    expect(error).toBeUndefined()
    const parsed = JSON.parse(stdout)
    expect(parsed).toHaveProperty('examples')
    expect(Array.isArray(parsed.examples)).toBe(true)
    expect(parsed.examples.length).toBeGreaterThan(0)
    expect(parsed.examples[0]).toHaveProperty('id')
    expect(parsed.examples[0]).toHaveProperty('name')
    expect(parsed.examples[0]).toHaveProperty('description')
  })
})

describe('example describe', () => {
  it('requires an id argument', async () => {
    const { error } = await runCli(['example', 'describe'])
    expect(error).toBeDefined()
  })

  it('exits non-zero on unknown id', async () => {
    const { error } = await runCli(['example', 'describe', 'no-such-example'])
    expect(error).toBeDefined()
  })

  it('prints metadata for a known example', async () => {
    const { stdout, error } = await runCli(['example', 'describe', 'eer-to-rel-small'])
    expect(error).toBeUndefined()
    expect(stdout).toMatch(/id:\s+eer-to-rel-small/)
    expect(stdout).toMatch(/name:/)
    expect(stdout).toMatch(/description:/)
  })
})

describe('example run', () => {
  it('requires an id argument', async () => {
    const { error } = await runCli(['example', 'run'])
    expect(error).toBeDefined()
  })

  it('exits non-zero on unknown id', async () => {
    const { error } = await runCli(['example', 'run', 'no-such-example'])
    expect(error).toBeDefined()
  })
})
