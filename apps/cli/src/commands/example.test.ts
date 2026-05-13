import { Command } from 'commander'
import { registerExampleCommand } from './example'

describe('example command', () => {
  it('registers list, describe, run subcommands', () => {
    const root = new Command()
    registerExampleCommand(root)
    const group = root.commands.find((c) => c.name() === 'example')
    expect(group).toBeDefined()
    const subs = group!.commands.map((c) => c.name())
    expect(subs).toEqual(expect.arrayContaining(['list', 'describe', 'run']))
  })

  it('list outputs registered runnable ids from the examples registry', () => {
    const root = new Command()
    // exitOverride prevents commander from calling process.exit on errors
    root.exitOverride()
    registerExampleCommand(root)
    const spy = jest.spyOn(console, 'log').mockImplementation(() => {})
    root.parse(['node', 'synth', 'example', 'list'])
    const output = spy.mock.calls.map((c) => c.join(' ')).join('\n')
    spy.mockRestore()
    // at least one known example id appears
    expect(output).toMatch(/eer-to-rel-small/)
  })

  it('describe with unknown id exits with code 1', () => {
    const root = new Command()
    registerExampleCommand(root)
    const errSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
    const exitSpy = jest.spyOn(process, 'exit').mockImplementation(((code?: number) => {
      throw new Error(`exit ${code ?? 0}`)
    }) as never)
    try {
      root.parse(['node', 'synth', 'example', 'describe', 'no-such-example'])
      fail('expected process.exit to be invoked')
    } catch (e) {
      expect((e as Error).message).toBe('exit 1')
    } finally {
      errSpy.mockRestore()
      exitSpy.mockRestore()
    }
  })

  it('describe with a known id prints id/name/description', () => {
    const root = new Command()
    registerExampleCommand(root)
    const spy = jest.spyOn(console, 'log').mockImplementation(() => {})
    root.parse(['node', 'synth', 'example', 'describe', 'eer-to-rel-small'])
    const output = spy.mock.calls.map((c) => c.join(' ')).join('\n')
    spy.mockRestore()
    expect(output).toMatch(/id:\s+eer-to-rel-small/)
    expect(output).toMatch(/name:/)
    expect(output).toMatch(/description:/)
  })
})
