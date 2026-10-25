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
  /** Exit code of the CLI process: 0 on success, undefined when killed by a signal. */
  code?: number
  error?: Error
}

export interface RunOptions {
  /** Override HOME directory for config resolution */
  home?: string
  /** Working directory for the command */
  cwd?: string
  /** Extra environment variables (e.g. EDITOR) merged over process.env */
  env?: Record<string, string>
}

/**
 * Run the CLI as a subprocess and capture output.
 * Use this instead of @oclif/test's runCommand to avoid Jest ESM issues.
 */
export async function runCli(args: string[], options?: RunOptions): Promise<RunResult> {
  // Never inherit color forcing from the parent run (rushx sets FORCE_COLOR on
  // a TTY): ANSI codes around oclif's '›' wrap prefix defeat the tests' flatten().
  const env: NodeJS.ProcessEnv = { ...process.env, FORCE_COLOR: '0', NO_COLOR: '1', ...options?.env }
  if (options?.home) {
    env.HOME = options.home
  }

  try {
    const { stdout, stderr } = await execAsync(
      `node ${binPath} ${args.join(' ')}`,
      {
        env,
        cwd: options?.cwd
      }
    )
    return { stdout, stderr, code: 0 }
  } catch (err: unknown) {
    // Under jest's vm modules the exec error comes from another realm, so
    // `instanceof Error` is unreliable; read the fields structurally.
    const execError = err as { stdout?: string; stderr?: string; code?: unknown }
    return {
      stdout: execError.stdout ?? '',
      stderr: execError.stderr ?? '',
      code: typeof execError.code === 'number' ? execError.code : undefined,
      error: err instanceof Error ? err : new Error(String(err))
    }
  }
}
