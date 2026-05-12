import { runCli } from '../test-utils/run-cli.js'

describe('help', () => {
  it('shows help with --help', async () => {
    const { stdout } = await runCli(['--help'])
    expect(stdout).toContain('synth')
    expect(stdout).toContain('COMMANDS')
  })

  it('shows help with -h', async () => {
    const { stdout } = await runCli(['-h'])
    expect(stdout).toContain('synth')
  })

  it('lists all documented topics', async () => {
    const { stdout } = await runCli(['--help'])
    expect(stdout).toContain('ns')
    expect(stdout).toContain('model')
    expect(stdout).toContain('tx')
    expect(stdout).toContain('config')
    expect(stdout).toContain('workspace')
  })

  it('shows topic help for ns', async () => {
    const { stdout } = await runCli(['ns', '--help'])
    expect(stdout).toContain('ls')
    expect(stdout).toContain('mk')
    expect(stdout).toContain('rm')
  })

  it('shows topic help for model', async () => {
    const { stdout } = await runCli(['model', '--help'])
    expect(stdout).toContain('ls')
    expect(stdout).toContain('show')
    expect(stdout).toContain('import')
    expect(stdout).toContain('export')
    expect(stdout).toContain('rm')
    expect(stdout).toContain('validate')
  })

  it('shows topic help for tx', async () => {
    const { stdout } = await runCli(['tx', '--help'])
    expect(stdout).toContain('ls')
    expect(stdout).toContain('install')
    expect(stdout).toContain('uninstall')
    expect(stdout).toContain('show')
    expect(stdout).toContain('init')
    expect(stdout).toContain('build')
    expect(stdout).toContain('test')
    expect(stdout).toContain('pack')
    expect(stdout).toContain('publish')
  })

  it('shows topic help for config', async () => {
    const { stdout } = await runCli(['config', '--help'])
    expect(stdout).toContain('init')
    expect(stdout).toContain('ls')
    expect(stdout).toContain('show')
    expect(stdout).toContain('edit')
    expect(stdout).toContain('rm')
  })
})

describe('unknown command', () => {
  it('produces non-zero exit for unknown command', async () => {
    const { error } = await runCli(['bogus'])
    expect(error).toBeDefined()
  })
})
