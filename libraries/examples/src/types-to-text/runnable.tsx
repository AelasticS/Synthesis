/** @jsx createExprNode */
import type { Runnable, RunResult } from "@synthesis/runner";
import { Context, createExprNode } from "@aelastics/synthesis/jsx";
import { ModelStore } from "@aelastics/synthesis/store";
import { TypeModel } from "@aelastics/synthesis/metamodels/types/components";

import { Types2TextModelTransformations } from "./types2text.model-transformation";

/**
 * Exercises the M2T transformation that turns a types-metamodel into a
 * structured text model (sections, paragraphs). The artifact-generation
 * side (writing files via `generate`) is intentionally not invoked here —
 * P4 only certifies wiring via the Runnable contract.
 */
export const run = async (): Promise<RunResult> => {
  const store = new ModelStore();
  const ctx = new Context();
  ctx.pushStore(store);

  const typeModel = <TypeModel name="Types2TextSmoke" store={store} />;

  const renderedTypeModel = typeModel.render(ctx);
  new Types2TextModelTransformations(store).transform(renderedTypeModel);

  return { artifacts: [] };
};

export const runnable: Runnable = {
  id: "types-to-text",
  name: "Types-metamodel → structured-text (M2T)",
  description:
    "A model-to-text transformation that emits a structured text model (directories, documents, sections, paragraphs) from a types-metamodel. Demonstrates the engine's M2T support distinct from the M2M pipeline.",
  async run(): Promise<RunResult> {
    return run();
  },
};
