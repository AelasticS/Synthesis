import { isInteractiveSession, isPromptCancel } from '../interactive.js'

// isInteractiveSession reads the real process streams and environment;
// the tests stub them and restore the originals afterwards.
const stdin = process.stdin as unknown as { isTTY?: boolean }
const stdout = process.stdout as unknown as { isTTY?: boolean }

describe('isInteractiveSession', () => {
  const originalStdinTty = stdin.isTTY
  const originalStdoutTty = stdout.isTTY
  const originalCi = process.env.CI

  beforeEach(() => {
    stdin.isTTY = true
    stdout.isTTY = true
    delete process.env.CI
  })

  afterAll(() => {
    stdin.isTTY = originalStdinTty
    stdout.isTTY = originalStdoutTty
    if (originalCi === undefined) {
      delete process.env.CI
    } else {
      process.env.CI = originalCi
    }
  })

  it('prompts only with TTYs on both ends', () => {
    expect(isInteractiveSession({})).toBe(true)
    stdin.isTTY = false
    expect(isInteractiveSession({})).toBe(false)
    stdin.isTTY = true
    stdout.isTTY = false
    expect(isInteractiveSession({})).toBe(false)
  })

  it('never prompts in --json or --quiet mode', () => {
    expect(isInteractiveSession({ json: true })).toBe(false)
    expect(isInteractiveSession({ quiet: true })).toBe(false)
  })

  it('a set, truthy CI value disables prompts', () => {
    for (const value of ['true', '1', 'yes', 'azure']) {
      process.env.CI = value
      expect(isInteractiveSession({})).toBe(false)
    }
  })

  it('CI=false, CI=0, and CI= (empty) keep interactivity in a real TTY', () => {
    for (const value of ['false', '0', '']) {
      process.env.CI = value
      expect(isInteractiveSession({})).toBe(true)
    }
  })
})

describe('isPromptCancel', () => {
  it('recognizes the inquirer cancel error by name and nothing else', () => {
    const cancel = new Error('ctrl+c')
    cancel.name = 'ExitPromptError'
    expect(isPromptCancel(cancel)).toBe(true)
    expect(isPromptCancel(new Error('other'))).toBe(false)
    expect(isPromptCancel('ExitPromptError')).toBe(false)
  })
})
