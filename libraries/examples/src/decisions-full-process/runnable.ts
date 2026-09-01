import type { Runnable, RunResult } from "@synthesis/runner";
import { Context } from "@aelastics/synthesis/jsx-runtime";
import { ModelStore } from "@aelastics/synthesis/engine";
import * as sm2ddm from "@aelastics/synthesis/decision-framework/decisions/4.source-model-2-default-configuration-model/SourceModel2DefaultConfigurationModel";
import * as dbmT from "@aelastics/synthesis/decision-framework/decisions/2.binding-model/binding-meta.model";
import type * as eerT from "@synthesis/standard-metamodels/eer/model";

import * as eerM from "../eer-as-types-metamodel/eer-metamodel-aelasticTypes";
import { createUniversityModel } from "./01-source-model";
import { createPersistenceDesignSpace } from "./02-design-space";
import { createBindingModel } from "./03-binding-model";

/**
 * Walks the full decision-driven transformation pipeline for the University
 * persistence example: render EER metamodel, design space, source schema,
 * and binding model; then derive a default configuration model from them.
 */
export const run = async (): Promise<RunResult> => {
  const store = new ModelStore();
  const context = new Context();

  // 1. EER metamodel (so binding can resolve its references).
  eerM.EERModel(store).render(context);

  // 2. Design space (generic decision model).
  createPersistenceDesignSpace(store).render(context);

  // 3. Source model (University EER schema).
  const universitySchema = createUniversityModel(store).render(
    context,
  ) as eerT.IEERSchema;

  // 4. Binding model (maps EER element types to GDM decisions).
  const bindingModel = createBindingModel(store).render(
    context,
  ) as dbmT.IBindingModel;

  // 5. Default configuration model derived from source + binding.
  const transformation = new sm2ddm.SourceModelToDefaultConfigurationModel(
    store,
    { bindingModel },
  );
  transformation.transform(universitySchema);

  return { artifacts: [] };
};

export const runnable: Runnable = {
  id: "decisions-full-process",
  name: "Full decision process (University EER → default configuration)",
  description:
    "End-to-end walkthrough of the decision-driven design process: source EER schema (University), generic decision model (persistence design space), binding model, then derivation of a default configuration model. Demonstrates how the decision framework's metamodels compose into a real authoring workflow.",
  async run(): Promise<RunResult> {
    return run();
  },
};
