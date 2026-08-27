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

  it('lists the canonical topics (aliases are hidden shortcuts)', async () => {
    const { stdout } = await runCli(['--help'])
    expect(stdout).toContain('namespace')
    expect(stdout).toContain('model')
    expect(stdout).toContain('transformation')
    expect(stdout).toContain('pipeline')
    expect(stdout).toContain('config')
    expect(stdout).toContain('workspace')
  })

  it('shows topic help for namespace and for its ns alias', async () => {
    for (const topic of ['namespace', 'ns']) {
      const { stdout } = await runCli([topic, '--help'])
      expect(stdout).toContain('ls')
      expect(stdout).toContain('mk')
      expect(stdout).toContain('rm')
    }
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

  it('shows topic help for transformation and for its tx alias', async () => {
    for (const topic of ['transformation', 'tx']) {
      const { stdout } = await runCli([topic, '--help'])
      expect(stdout).toContain('ls')
      expect(stdout).toContain('install')
      expect(stdout).toContain('uninstall')
      expect(stdout).toContain('run')
      expect(stdout).toContain('show')
      expect(stdout).toContain('init')
      expect(stdout).toContain('build')
      expect(stdout).toContain('test')
      expect(stdout).toContain('pack')
      expect(stdout).toContain('publish')
    }
  })

  it('shows topic help for pipeline and for its pl alias', async () => {
    for (const topic of ['pipeline', 'pl']) {
      const { stdout } = await runCli([topic, '--help'])
      expect(stdout).toContain('mk')
      expect(stdout).toContain('run')
      expect(stdout).toContain('ls')
      expect(stdout).toContain('show')
      expect(stdout).toContain('rm')
      expect(stdout).toContain('edit')
    }
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
