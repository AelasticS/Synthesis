/**
 * The interactive session guard and the prompter the picker flows use.
 *
 * Interactivity is strictly opt-in by circumstance: prompts appear ONLY
 * when both stdin and stdout are TTYs, the invocation asked for human
 * output (no --json, no --quiet), and the environment is not CI. In every
 * other case the commands take their unchanged non-interactive path and
 * fail with exactly the errors they always produced: piped invocations,
 * scripts, and CI never see a prompt.
 *
 * The flows themselves (src/interactive/flows.ts) never import
 * @inquirer/prompts: they receive a `Prompter`, so tests drive them with a
 * scripted stub and no TTY. Only `makeInquirerPrompter` binds to the real
 * prompt implementations, and only the interactive command branch loads it.
 */

export interface PromptChoice<T> {
  /** The line shown in the list. */
  name: string
  value: T
  /** Secondary line shown for the highlighted entry. */
  description?: string
}

/** The prompt surface the flows program against; injectable for tests. */
export interface Prompter {
  /** Type-to-filter list, for candidate sets of any size. */
  search<T>(message: string, choices: ReadonlyArray<PromptChoice<T>>): Promise<T>
  /** Small fixed choice set. */
  select<T>(message: string, choices: ReadonlyArray<PromptChoice<T>>): Promise<T>
  confirm(message: string, defaultValue: boolean): Promise<boolean>
  /** Free-form line; `defaultValue` may be undefined (no default offered). */
  input(message: string, defaultValue?: string): Promise<string>
}

/**
 * Whether the environment declares itself CI: a set, TRUTHY `CI` value.
 * `CI=false`, `CI=0`, and `CI=` (empty) explicitly opt back IN to
 * interactivity, because some tools export CI unconditionally, and a falsy value
 * in a real TTY means "not CI".
 */
function isCiEnvironment(): boolean {
  const value = process.env.CI
  return value !== undefined && value !== '' && value !== 'false' && value !== '0'
}

/**
 * Whether this invocation may prompt: real TTYs on both ends, human output
 * mode, and not CI. `json`/`quiet` come from the command's parsed flags.
 */
export function isInteractiveSession(flags: { json?: boolean; quiet?: boolean }): boolean {
  return (
    Boolean(process.stdin.isTTY) &&
    Boolean(process.stdout.isTTY) &&
    !flags.json &&
    !flags.quiet &&
    !isCiEnvironment()
  )
}

/**
 * True when `err` is the user cancelling a prompt (ctrl+c); the commands
 * turn it into a clean abort instead of a stack trace.
 */
export function isPromptCancel(err: unknown): boolean {
  return err instanceof Error && err.name === 'ExitPromptError'
}

/** The real prompter, bound to @inquirer/prompts. */
export async function makeInquirerPrompter(): Promise<Prompter> {
  const { confirm, input, search, select } = await import('@inquirer/prompts')
  const contains = (haystack: string, needle: string): boolean =>
    haystack.toLowerCase().includes(needle.toLowerCase())
  return {
    async search<T>(message: string, choices: ReadonlyArray<PromptChoice<T>>): Promise<T> {
      return search({
        message,
        source: (term) =>
          term === undefined || term === ''
            ? [...choices]
            : choices.filter((choice) => contains(choice.name, term) || contains(choice.description ?? '', term))
      })
    },
    async select<T>(message: string, choices: ReadonlyArray<PromptChoice<T>>): Promise<T> {
      return select({ message, choices: [...choices] })
    },
    async confirm(message: string, defaultValue: boolean): Promise<boolean> {
      return confirm({ message, default: defaultValue })
    },
    async input(message: string, defaultValue?: string): Promise<string> {
      return input(defaultValue === undefined ? { message } : { message, default: defaultValue })
    }
  }
}
