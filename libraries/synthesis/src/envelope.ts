// Namespace: the $synth header types shared by the CLI import gate and
// model authors. SynthHeaderInput is the authored form, SynthHeader is the
// normalized form the CLI maintains in the workspace copy.

/** The document kinds a $synth header can declare. */
export type SynthHeaderKind =
  | 'model'
  | 'metamodel'
  | 'decision-model'
  | 'binding-model'
  | 'configuration-model'

/** Provenance stamped on generated models: the transformation run that produced the file. */
export interface SynthGeneratedBy {
  tx: string
  txVersion?: string
  config?: string
  /** Verbatim --param JSON of the generating run, when one was given. */
  param?: string
  date: string
}

/** The normalized full form of the $synth header, as the CLI stamps it into workspace files. */
export interface SynthHeader {
  kind: SynthHeaderKind
  metamodel: string
  references: Record<string, string>
  generatedBy: SynthGeneratedBy | null
  createdAt: string
  modifiedAt: string
  author: string
  version: string
  description: string
  tags: string[]
  license: string | null
  custom: Record<string, unknown>
}

/**
 * The authored form of the $synth header. Only `kind` and `metamodel` are
 * required; the import gate fills every other field with a default when it
 * is absent. Member types are readonly friendly, so a literal written as
 * `export const $synth = { ... } as const satisfies SynthHeaderInput`
 * type-checks without widening.
 */
export interface SynthHeaderInput {
  kind: SynthHeaderKind
  metamodel: string
  references?: Readonly<Record<string, string>>
  generatedBy?: Readonly<SynthGeneratedBy> | null
  createdAt?: string
  modifiedAt?: string
  author?: string
  version?: string
  description?: string
  tags?: ReadonlyArray<string>
  license?: string | null
  custom?: Readonly<Record<string, unknown>>
}
