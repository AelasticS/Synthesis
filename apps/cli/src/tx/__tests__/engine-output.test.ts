import { EngineOutputBuffer } from '../engine-output.js'

describe('EngineOutputBuffer', () => {
  const captureStderr = (): { writes: string[]; restore: () => void } => {
    const writes: string[] = []
    const original = process.stderr.write.bind(process.stderr)
    process.stderr.write = ((chunk: unknown): boolean => {
      writes.push(String(chunk))
      return true
    }) as typeof process.stderr.write
    return { writes, restore: () => { process.stderr.write = original } }
  }

  it('buffers console.log during run and restores it afterwards', async () => {
    const buffer = new EngineOutputBuffer(true)
    const original = console.log
    const result = await buffer.run(() => {
      expect(console.log).not.toBe(original)
      return 42
    })
    expect(result).toBe(42)
    expect(console.log).toBe(original)
  })

  it('drops the output of a successful call: a later failure flushes only its own output', async () => {
    const buffer = new EngineOutputBuffer(true)
    await buffer.run(() => {
      console.log('step one noise')
    })
    await expect(
      buffer.run(() => {
        console.log('step two context')
        throw new Error('boom')
      })
    ).rejects.toThrow('boom')

    const { writes, restore } = captureStderr()
    try {
      buffer.flushToStderr()
    } finally {
      restore()
    }
    const flushed = writes.join('')
    expect(flushed).toContain('step two context')
    expect(flushed).not.toContain('step one noise')
  })

  it('flushes nothing when every call succeeded', async () => {
    const buffer = new EngineOutputBuffer(true)
    await buffer.run(() => {
      console.log('quiet success')
    })
    const { writes, restore } = captureStderr()
    try {
      buffer.flushToStderr()
    } finally {
      restore()
    }
    expect(writes).toEqual([])
  })

  it('passes output straight through when inactive (--verbose)', async () => {
    const buffer = new EngineOutputBuffer(false)
    const original = console.log
    await buffer.run(() => {
      expect(console.log).toBe(original)
    })
  })
})
