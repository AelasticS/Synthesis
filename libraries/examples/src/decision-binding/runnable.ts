import type { Runnable, RunResult } from "@synthesis/runner";
import { Context } from "@synthesis/jsx-runtime";
import { ModelStore } from "@synthesis/engine";

import { EERModel } from "../eer-as-types-metamodel/eer-metamodel-aelasticTypes";
import { NamingConventionGDM } from "./generic-decision-model-example";
import { bindingModel } from "./decision-binding-model-example";

/**
 * Renders the metamodels and the decision-binding model that ties an EER
 * source metamodel to a generic decision model. This is a binding-only
 * example — no source model transformation runs here.
 */
export const run = async (): Promise<RunResult> => {
  const store = new ModelStore();
  const context = new Context();

  // Render the EER metamodel-as-types-metamodel so its element registry
  // is populated for the binding to reference.
  EERModel(store).render(context);

  // Render the generic decision model (naming conventions).
  (NamingConventionGDM.props as { store?: ModelStore }).store = store;
  NamingConventionGDM.render(context);

  // Render the binding model that ties them together.
  bindingModel(store).render(context);

  return { artifacts: [] };
};

export const runnable: Runnable = {
  id: "decision-binding",
  name: "Decision binding model (EER source + naming-convention GDM)",
  description:
    "Builds a decision-binding model that ties an EER source metamodel (expressed as a types-metamodel) to a generic decision model for naming conventions and the foreign-key-vs-join-table strategy. Demonstrates the binding metamodel together with the decision metamodel and the types metamodel.",
  async run(): Promise<RunResult> {
    return run();
  },
};
