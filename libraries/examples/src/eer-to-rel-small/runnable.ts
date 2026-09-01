import type { Runnable, RunResult } from "@synthesis/runner";
import { Context } from "@aelastics/synthesis/jsx-runtime";
import { ModelStore } from "@aelastics/synthesis/engine";
import type * as eerT from "@synthesis/standard-metamodels/eer/model";
import * as bmT from "@aelastics/synthesis/decision-framework/decisions/2.binding-model/binding-meta.model";
import * as sm2ddm from "@aelastics/synthesis/decision-framework/decisions/4.source-model-2-default-configuration-model/SourceModel2DefaultConfigurationModel";

import * as eerMMFn from "./er-metamodel";
import * as smFn from "./01-source-model";
import * as dmFn from "./02-decision-model";
import * as bmFn from "./03-binding-model";
import * as ee2RelT from "./EER2RelDomainWithDecisionTransformation";

/**
 * End-to-end execution of the small EER-to-Relational example with a decision
 * model. The function exercises the transformation pipeline so that any
 * regression in engine + decision-framework + standard-metamodels surfaces
 * here. Artifact production is intentionally a stub for P4; full output
 * generation lands in a later pass.
 */
export const run = async (): Promise<RunResult> => {
  const store = new ModelStore();
  const context = new Context();

  const smm = eerMMFn.EERModel(store);
  const dm = dmFn.RelationSchemaDesignIssues(store);
  const bm = bmFn.ER_Bindings(store);
  const sm = smFn.CompanySchema(store);

  smm.render(context);
  dm.render(context);
  const bindingModel: bmT.IBindingModel = bm.render(context);
  const eerSchema = sm.render(context);

  const sm2ddmTransformation = new sm2ddm.SourceModelToDefaultConfigurationModel(
    store,
    { bindingModel },
  );
  const defaultDecisionModel = sm2ddmTransformation.transform(
    eerSchema as eerT.IEERSchema,
  );

  const eer2RelTransformation = new ee2RelT.EER2RelDomainWithDecisionTransformation(
    store,
    {},
    defaultDecisionModel,
  );
  eer2RelTransformation.transform(eerSchema as eerT.IEERSchema);

  return { artifacts: [] };
};

export const runnable: Runnable = {
  id: "eer-to-rel-small",
  name: "EER to Relational (small, with decisions)",
  description:
    "Transforms a small EER schema (Person/Company/Employment) into a relational schema using a decision model that selects the strategy for 1:N relationships and naming conventions. Demonstrates the EER and Relational metamodels together with the decision framework.",
  async run(): Promise<RunResult> {
    return run();
  },
};
