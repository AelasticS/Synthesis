import { exec } from 'node:child_process'
import { promisify } from 'node:util'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const execAsync = promisify(exec)

const __dirname = dirname(fileURLToPath(import.meta.url))
const binPath = resolve(__dirname, '../..', 'bin/run.js')

export interface RunResult {
  stdout: string
  stderr: string
  error?: Error
}

export interface RunOptions {
  /** Working directory to run the command from */
  cwd?: string
}

/**
 * Run the CLI as a subprocess and capture output.
 * Use this instead of @oclif/test's runCommand to avoid Jest ESM issues.
 */
export async function runCli(args: string[], options?: RunOptions): Promise<RunResult> {
  try {
    const { stdout, stderr } = await execAsync(`node ${binPath} ${args.join(' ')}`, {
      cwd: options?.cwd
    })
    return { stdout, stderr }
  } catch (err: unknown) {
    const execError = err as { stdout?: string; stderr?: string; message?: string }
    return {
      stdout: execError.stdout ?? '',
      stderr: execError.stderr ?? '',
      error: err instanceof Error ? err : new Error(String(err))
    }
  }
}
