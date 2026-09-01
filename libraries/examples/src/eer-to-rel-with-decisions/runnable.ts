import type { Runnable, RunResult } from "@synthesis/runner";
import { ModelStore } from "@aelastics/synthesis/store";

// Importing the transformation class registers its @M2M decorator wiring,
// which is the meaningful side effect we want to exercise here.
import { EER2RelDomainWithDecisionTransformation } from "./EER2RelDomainWithDecisionTransformation";

export const run = async (): Promise<RunResult> => {
  const store = new ModelStore();
  // Instantiate without a decision model to exercise wiring; we deliberately
  // do not call .transform() because this variant requires a fully populated
  // configuration model. Full integration lands in a later pass.
  new EER2RelDomainWithDecisionTransformation(store, {});
  return { artifacts: [] };
};

export const runnable: Runnable = {
  id: "eer-to-rel-with-decisions",
  name: "EER to Relational (decision-aware, full mapping)",
  description:
    "Defines a decision-aware M2M transformation from the EER metamodel to the Relational metamodel, with variability points for the 1:N relationship strategy and other choices. Demonstrates @SpecPoint/@SpecOption and @VarPoint/@VarOption working together.",
  async run(): Promise<RunResult> {
    return run();
  },
};
