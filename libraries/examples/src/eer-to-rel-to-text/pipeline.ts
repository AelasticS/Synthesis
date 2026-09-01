import { Context } from "@aelastics/synthesis/jsx"
import { ModelStore } from "@aelastics/synthesis/store"
import { generate } from "@aelastics/synthesis/m2t"
import { isSuccess } from "@aelastics/result"
import type * as eerT from "@synthesis/standard-metamodels/eer/model"
import type * as rmT from "@synthesis/standard-metamodels/relational/model-legacy"
import type * as bmT from "@aelastics/synthesis/metamodels/binding/model"
import { SourceModelToDefaultConfigurationModel } from "@aelastics/synthesis/variability"

// Reuse the engine pieces of the existing eer-to-rel-small example.
// We intentionally do NOT duplicate the transformation logic — this
// showcase composes the existing pieces and adds an M2T text-generation
// stage on top.
import { EERModel } from "../eer-to-rel-small/er-metamodel"
import { RelationSchemaDesignIssues } from "../eer-to-rel-small/02-decision-model"
import { ER_Bindings } from "../eer-to-rel-small/03-binding-model"
import { EER2RelDomainWithDecisionTransformation } from "../eer-to-rel-small/EER2RelDomainWithDecisionTransformation"

import { PersonsSchema } from "./source-model"
import { Rel2DdlTransformation } from "./ddl-template"
import { RELModel } from "./rel-metamodel"
import { DdlGenerationIssues } from "./02-decision-model"
import { Rel_Bindings } from "./03-binding-model"

/**
 * End-to-end Synthesis showcase:
 *   1. Author Persons EER schema in JSX.
 *   2. Build the EER metamodel, the relational design decisions,
 *      and the binding model.
 *   3. Derive a default configuration model from the source + binding
 *      (snake_case is the decision-model's default).
 *   4. Run the existing decision-aware EER->Rel transformation.
 *   5. Run the M2T transformation that emits SQL DDL.
 *   6. Render the M2T tree to a string via the engine's `generate`.
 */
export interface PipelineOptions {
  /**
   * When false, the Rel->DDL step runs WITHOUT a configuration model
   * (store-only construction): the transformation must fall back to its
   * @Default variability option (Unquoted). Default: true.
   */
  withDdlConfig?: boolean
}

export async function runEerToRelToText(options: PipelineOptions = {}): Promise<{ sql: string }> {
  const withDdlConfig = options.withDdlConfig !== false
  const store = new ModelStore()
  const ctx = new Context()

  // Phase 1 — render foundational models into the store: the EER->Rel
  // pieces and the Rel->DDL decision/binding pieces (both transformations
  // are decision-aware).
  const eerMM = EERModel(store)
  const decisionModel = RelationSchemaDesignIssues(store)
  const bindingModel = ER_Bindings(store)
  const sourceModel = PersonsSchema(store)

  eerMM.render(ctx)
  decisionModel.render(ctx)
  const renderedBinding: bmT.IBindingModel = bindingModel.render(ctx)
  const renderedSource = sourceModel.render(ctx) as eerT.IEERSchema

  RELModel(store).render(ctx)
  DdlGenerationIssues(store).render(ctx)
  const renderedDdlBinding: bmT.IBindingModel = Rel_Bindings(store).render(ctx)

  // Phase 2 — derive a default configuration from source + binding.
  // The decision model defaults NamingConvention to SnakeCase, so the
  // generated DDL identifiers come out as person_id, organization_name, ...
  const sm2cfg = new SourceModelToDefaultConfigurationModel(store, {
    bindingModel: renderedBinding,
  })
  const configModel = sm2cfg.transform(renderedSource)

  // Phase 3 — decision-aware EER -> Relational.
  const eer2rel = new EER2RelDomainWithDecisionTransformation(store, {}, configModel)
  const relSchema = eer2rel.transform(renderedSource) as rmT.IRelSchema

  // Phase 4 — Relational -> M2T model. The DDL transformation is
  // decision-aware too: derive its default configuration (IdentifierQuoting
  // defaults to Unquoted) from the relational schema + DDL binding model,
  // exactly as phase 2 did for the EER->Rel step. Without a configuration
  // (withDdlConfig: false) the transformation runs store-only and relies on
  // its @Default option.
  let rel2ddl: Rel2DdlTransformation
  if (withDdlConfig) {
    const rel2ddlCfg = new SourceModelToDefaultConfigurationModel(store, {
      bindingModel: renderedDdlBinding,
    })
    const ddlConfigModel = rel2ddlCfg.transform(relSchema)
    rel2ddl = new Rel2DdlTransformation(store, {}, ddlConfigModel)
  } else {
    rel2ddl = new Rel2DdlTransformation(store)
  }
  const m2tModel = rel2ddl.transform(relSchema)

  // Phase 5 — M2T model -> SQL string. mock mode never touches the FS.
  const genResult = await generate(store, m2tModel, { mode: "mock" })

  // Stitch together the content of every successfully generated Doc
  // (typically a single .sql file).
  const sqlParts: string[] = []
  for (const item of genResult.results) {
    if (item.itemType === "Doc" && isSuccess(item.outcome)) {
      sqlParts.push(item.outcome.value)
    }
  }

  return { sql: sqlParts.join("\n") }
}
