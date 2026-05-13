import { Context } from "@synthesis/jsx-runtime"
import { ModelStore, generate } from "@synthesis/engine"
import { isSuccess } from "@aelastics/result"
import type * as eerT from "@synthesis/standard-metamodels/eer/model"
import type * as rmT from "@synthesis/standard-metamodels/relational/model-legacy"
import type * as bmT from "@synthesis/decision-framework/decisions/2.binding-model/binding-meta.model"
import { SourceModelToDefaultConfigurationModel } from "@synthesis/decision-framework/decisions/4.source-model-2-default-configuration-model/SourceModel2DefaultConfigurationModel"

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
export async function runEerToRelToText(): Promise<{ sql: string }> {
  const store = new ModelStore()
  const ctx = new Context()

  // Phase 1 — render foundational models into the store.
  const eerMM = EERModel(store)
  const decisionModel = RelationSchemaDesignIssues(store)
  const bindingModel = ER_Bindings(store)
  const sourceModel = PersonsSchema(store)

  eerMM.render(ctx)
  decisionModel.render(ctx)
  const renderedBinding: bmT.IBindingModel = bindingModel.render(ctx)
  const renderedSource = sourceModel.render(ctx) as eerT.IEERSchema

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

  // Phase 4 — Relational -> M2T model.
  const rel2ddl = new Rel2DdlTransformation(store)
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
