import type { Runnable, RunResult } from "@synthesis/runner"
import { runEerToRelToText } from "./pipeline"

/**
 * Runnable wrapper for the full end-to-end showcase. The pipeline composes
 * the EER metamodel, the decision/binding/configuration framework, the
 * existing EER->Relational decision-aware transformation, and a small M2T
 * template that emits SQL DDL. The generated SQL is returned as a single
 * `schema.sql` artifact.
 */
export const runnable: Runnable = {
  id: "eer-to-rel-to-text",
  name: "EER -> Relational -> SQL DDL (full showcase)",
  description:
    "End-to-end Synthesis showcase: authors a small EER schema in JSX (Person, Organization, worksIn), applies the decision-aware EER->Relational transformation with the snake_case naming convention, then generates SQL DDL via the engine's M2T runtime. Demonstrates JSX authoring, decision/configuration models, decision-aware M2M, and model-to-text in one pipeline.",
  async run(): Promise<RunResult> {
    const { sql } = await runEerToRelToText()
    return {
      artifacts: [{ name: "schema.sql", content: sql }],
    }
  },
}
