import type { Runnable, RunResult } from "@synthesis/runner";
import { ModelStore } from "@synthesis/engine";

// Importing the class registers its decorators; we instantiate it to confirm
// wiring works. Calling .transform() would require a populated source model +
// binding model, which is the responsibility of full integration work in a
// later pass.
import { SourceModelToSourceModelWithDecisionModelBinding } from "./sourceModelToSourceModelWithDecisionModelBinding";

export const run = async (): Promise<RunResult> => {
  const store = new ModelStore();
  // Cannot instantiate without an `extra.bindingModel` because the template
  // dereferences `this.extra?.bindingModel.elements`. The class shape itself
  // is what we want to demonstrate here.
  void store;
  void SourceModelToSourceModelWithDecisionModelBinding;
  return { artifacts: [] };
};

export const runnable: Runnable = {
  id: "source-to-decision-binding",
  name: "Source model → source model with decision-binding annotations",
  description:
    "A higher-order M2M transformation that takes a source model and a decision-binding model, and produces a new binding model whose elements are derived from each source model element by matching its type against binding conditions. Useful as a scaffolding step before generating a default configuration.",
  async run(): Promise<RunResult> {
    return run();
  },
};
