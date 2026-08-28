/**
 * Manifest-driven chain pre-flight shared by every surface that has to
 * judge a sequence of transformations WITHOUT executing it: the execution
 * core (`transformation run`, `pipeline run`), the static authoring path
 * (`pipeline mk`, post-`pipeline edit` warnings), and `doctor`. One
 * implementation, so the run-time refusal and the authoring-time refusal
 * can never disagree about what a valid chain is.
 */

import type { WorkspaceConfig } from '../config/index.js'
import { errorMessage } from '../support/errors.js'
import { EXIT_CODES } from '../support/exit-codes.js'
import { ExecuteError } from './execute-error.js'
import { resolveInstalledTx, TxResolveError } from './load.js'
import type { TxManifest } from './manifest.js'

/** One resolved step of a chain: the name as given, plus the installed package. */
export interface ChainStep {
  txName: string
  packageDir: string
  manifest: TxManifest
}

/**
 * Resolve every named transformation and its manifest, in order. Throws
 * ExecuteError with the exit code the failure maps to (NOT_FOUND for an
 * unknown or vanished installation, FAILURE for a broken manifest).
 */
export async function resolveChainSteps(workspaceConfig: WorkspaceConfig, txNames: string[]): Promise<ChainStep[]> {
  const steps: ChainStep[] = []
  for (const txName of txNames) {
    try {
      const { packageDir, manifest } = await resolveInstalledTx(workspaceConfig, txName)
      steps.push({ txName, packageDir, manifest })
    } catch (err) {
      throw new ExecuteError(err instanceof TxResolveError ? err.exit : EXIT_CODES.FAILURE, errorMessage(err), {
        cause: err
      })
    }
  }
  return steps
}

/** A structural chain defect; `exit` maps to the CLI exit code when it is fatal. */
export interface ChainProblem {
  exit: number
  message: string
}

/**
 * Structural chain checks from manifests alone, no engine work, no
 * model access: text is terminal (only the last step may be m2t), and
 * step N's target metamodel must equal step N+1's source metamodel (the
 * incompatible pair is named). Returns every problem; execution fails on
 * the first, authoring surfaces report them as errors or warnings.
 */
export function chainStructureProblems(steps: ReadonlyArray<{ manifest: TxManifest }>): ChainProblem[] {
  const problems: ChainProblem[] = []
  const stepLabel = (index: number): string => `step ${index + 1} (${steps[index].manifest.name})`
  for (let i = 0; i < steps.length - 1; i++) {
    if (steps[i].manifest.kind === 'm2t') {
      problems.push({
        exit: EXIT_CODES.FAILURE,
        message: `${stepLabel(i)} is m2t; text is terminal, so an m2t transformation can only be the last step of a chain.`
      })
    }
  }
  for (let i = 0; i < steps.length - 1; i++) {
    const produced = steps[i].manifest.target.metamodel
    const expected = steps[i + 1].manifest.source.metamodel
    if (produced !== expected) {
      problems.push({
        exit: EXIT_CODES.VALIDATION_FAILURE,
        message: `Chain type mismatch: ${stepLabel(i)} produces metamodel '${produced}' but ${stepLabel(i + 1)} expects '${expected}'.`
      })
    }
  }
  return problems
}
