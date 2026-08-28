import { BaseCommand } from '../base/base-command.js'
import { completionCandidates } from '../candidates/completion.js'

/**
 * Hidden machine-facing command behind the dynamic shell completion: the
 * shipped bash/zsh snippets (scripts/completion/) call it on TAB with the
 * words typed so far and complete with whatever it prints. Humans never
 * run it; it is hidden from help and never fails (an unknown context
 * prints nothing and exits 0 — the shell then falls back to command/flag
 * completion).
 */
export default class Completions extends BaseCommand {
  static override hidden = true

  // The words being completed may look like flags ('--in'); everything
  // after the `--` terminator reaches argv untouched.
  static override strict = false

  static override description = `Print completion candidate values for a partial command line (internal).

Usage: synth completions -- <words...> — the words after the program name, the last one being the word under the cursor ('' when a new word starts). Prints newline-separated candidate values for that position (transformation names, model/configuration refs, pipeline names, namespaces), filtered by the partial word; prints nothing for positions it has no candidates for. Used by the completion scripts under scripts/completion/.`

  static override examples = ['<%= config.bin %> <%= command.id %> -- transformation run e']

  public async execute(): Promise<void> {
    const { argv } = await this.parse(Completions)
    let candidates: string[]
    try {
      // The completion engine's command knowledge (alias ids, value-taking
      // flags) comes from the loaded oclif config — never hand-maintained.
      const commands = this.config.commands.map((command) => ({
        id: command.id.replaceAll(':', ' '),
        aliases: (command.aliases ?? []).map((alias) => alias.replaceAll(':', ' ')),
        valueFlags: Object.entries(command.flags ?? {})
          .filter(([, flag]) => flag.type === 'option')
          .map(([name]) => `--${name}`)
      }))
      candidates = await completionCandidates(this.workspaceConfig, commands, argv.map(String))
    } catch {
      // Completion assists; it never errors. No candidates, exit 0.
      candidates = []
    }
    for (const candidate of candidates) {
      this.log(candidate)
    }
  }
}
