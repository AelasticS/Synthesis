import { Args, Flags } from '@oclif/core'

import { BaseCommand } from '../../base/base-command.js'
import { getPipelinesPath } from '../../config/index.js'
import {
  newPipelineNameProblem,
  pipelineFileExists,
  readPipelineFile,
  savePipeline
} from '../../pipelines/store.js'
import { EXIT_CODES } from '../../support/exit-codes.js'
import { chainStructureProblems, resolveChainSteps } from '../../tx/chain.js'
import type { ChainStep } from '../../tx/chain.js'

export default class PipelineMk extends BaseCommand {
  static override aliases = ['pl:mk']

  static override description = `Create a saved pipeline from an ordered list of installed transformations.

Validation is static (nothing is executed): the name must be a valid segment and must not shadow an installed transformation, every step must be installed, the chain must type-check from the manifests (step N's target metamodel equals step N+1's source metamodel), and only the last step may be m2t. A pipeline stores the process only (its steps): no input model, no configuration, no consent flags; every 'pipeline run' names its own data explicitly. An existing pipeline is only replaced with --overwrite (createdAt survives). Exit codes: 2 for a chain type mismatch, 3 for a step that is not installed.`

  static override examples = [
    '<%= config.bin %> <%= command.id %> gen-sql eer-to-relational rel-to-sql-ddl',
    '<%= config.bin %> <%= command.id %> gen-sql eer-to-relational rel-to-sql-ddl --description "EER to SQL DDL" --overwrite'
  ]

  // Variadic: the first positional is the pipeline name, every further
  // one a transformation step. `strict = false` lets oclif pass them all.
  static override strict = false

  static override args = {
    name: Args.string({
      description: 'Name for the pipeline (letters, digits, hyphen, underscore).',
      required: true
    }),
    tx: Args.string({
      description: 'Installed transformations forming the steps, in execution order (at least one).'
    })
  }

  static override flags = {
    description: Flags.string({
      description: 'One-line description stored with the pipeline.'
    }),
    overwrite: Flags.boolean({
      description: 'Replace an existing pipeline of the same name (createdAt survives).',
      default: false
    })
  }

  public async execute(): Promise<void> {
    const { argv, flags } = await this.parse(PipelineMk)
    const json = Boolean(flags.json)
    this.requireInitializedWorkspace(json)

    const [name, ...steps] = argv.map(String)
    const pipelinesDir = getPipelinesPath(this.workspaceConfig)

    const nameProblem = newPipelineNameProblem(name, Object.keys(this.workspaceConfig.transformations))
    if (nameProblem !== undefined) {
      this.jsonAwareFail(json, nameProblem, EXIT_CODES.FAILURE)
    }
    if (steps.length === 0) {
      this.jsonAwareFail(
        json,
        `A pipeline needs at least one step: synth pipeline mk ${name} <transformation> [<transformation> ...]`,
        EXIT_CODES.FAILURE
      )
    }

    // Static chain validation, shared with the execution pre-flight:
    // every step installed with a readable manifest, m2t only last, and
    // adjacent metamodels compatible. Nothing executes.
    let resolved: ChainStep[]
    try {
      resolved = await resolveChainSteps(this.workspaceConfig, steps)
    } catch (err) {
      this.failFromExecuteError(json, err)
    }
    for (const problem of chainStructureProblems(resolved)) {
      this.jsonAwareFail(json, problem.message, problem.exit)
    }

    let createdAt: string | undefined
    let preservedDescription: string | undefined
    if (pipelineFileExists(pipelinesDir, name)) {
      if (!flags.overwrite) {
        this.jsonAwareFail(json, `Pipeline already exists: ${name}. Use --overwrite to replace it.`, EXIT_CODES.FAILURE)
      }
      const existing = await readPipelineFile(pipelinesDir, name)
      createdAt = existing.pipeline?.createdAt
      preservedDescription = existing.pipeline?.description
    }

    const now = new Date().toISOString()
    const path = await savePipeline(pipelinesDir, {
      name,
      steps,
      description: flags.description ?? preservedDescription ?? '',
      createdAt: createdAt !== undefined && createdAt !== '' ? createdAt : now,
      modifiedAt: now
    })

    if (json) {
      this.log(JSON.stringify({ saved: name, steps, path }))
      return
    }
    this.log(`Saved pipeline '${name}' (${path}): ${steps.join(' -> ')}`)
    this.log(`Run it with: synth pipeline run ${name} --in <ref>`)
  }
}
