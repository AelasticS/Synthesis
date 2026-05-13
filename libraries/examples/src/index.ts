// @synthesis/examples — root barrel.
//
// Each example sub-folder wraps its transformation as a Runnable (from
// @synthesis/runner). This file aggregates them into a single registry so
// downstream consumers (currently the CLI) can list, describe, and execute
// examples by id.
//
// IMPORTANT: registration uses lazy proxy Runnables. The static metadata
// (id/name/description) is inlined here, and the heavy per-example modules
// (which transitively load metamodel schemas with global side effects) are
// only required when `.run()` is actually invoked. This prevents conflicts
// between sibling examples that pull in different REL metamodel variants
// (v1/legacy vs v2) at module-init time. The CLI walks this registry for
// list/describe without paying the load cost.

import type { Runnable, RunResult } from "@synthesis/runner";
import { RunnableRegistry } from "@synthesis/runner";

interface RunnableMeta {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  /** Returns the concrete Runnable defined in the example's runnable.ts. */
  readonly load: () => Runnable;
}

const metas: ReadonlyArray<RunnableMeta> = [
  {
    id: "eer-to-rel-small",
    name: "EER to Relational (small example with decisions)",
    description:
      "Transforms a small EER schema (Person/Company/Employment) into a relational schema using a decision model that selects the strategy for 1:N relationships and naming conventions. Demonstrates the EER and Relational metamodels together with the decision framework.",
    load: () => require("./eer-to-rel-small/runnable").runnable as Runnable,
  },
  {
    id: "eer-to-rel-with-decisions",
    name: "EER to Relational (decision-aware, full mapping)",
    description:
      "Defines a decision-aware M2M transformation from the EER metamodel to the Relational metamodel (v2), with variability points for the 1:N relationship strategy and other choices. Demonstrates @SpecPoint/@SpecOption and @VarPoint/@VarOption working together.",
    load: () => require("./eer-to-rel-with-decisions/runnable").runnable as Runnable,
  },
  {
    id: "decision-binding",
    name: "Decision binding",
    description:
      "Demonstrates how a decision model binds to a transformation via the decision-framework, separating intent (decisions) from mechanism (rules).",
    load: () => require("./decision-binding/runnable").runnable as Runnable,
  },
  {
    id: "decisions-full-process",
    name: "Decisions full process",
    description:
      "Walks through the full decision-driven transformation process end-to-end: defining decisions, binding them to rules, and producing a target model.",
    load: () => require("./decisions-full-process/runnable").runnable as Runnable,
  },
  {
    id: "source-to-decision-binding",
    name: "Source-to-decision binding",
    description:
      "Illustrates binding source model elements to decision models, including how source state influences decision resolution at transformation time.",
    load: () => require("./source-to-decision-binding/runnable").runnable as Runnable,
  },
  {
    id: "types-to-text",
    name: "Types to text",
    description:
      "A simple text-generation example: takes a typed model and renders a textual artifact. Useful as a minimal end-to-end smoke test of the runner contract.",
    load: () => require("./types-to-text/runnable").runnable as Runnable,
  },
];

function makeLazyRunnable(meta: RunnableMeta): Runnable {
  let resolved: Runnable | undefined;
  return {
    id: meta.id,
    name: meta.name,
    description: meta.description,
    run: async (): Promise<RunResult> => {
      if (!resolved) {
        resolved = meta.load();
      }
      return resolved.run();
    },
  };
}

export const examplesRegistry = new RunnableRegistry();
for (const m of metas) {
  examplesRegistry.register(makeLazyRunnable(m));
}
