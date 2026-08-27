/** @jsx createExprNode */

import { createExprNode } from "@synthesis/jsx-runtime"
import { ExprNode } from "@synthesis/jsx-runtime"
import { ModelStore } from "@synthesis/engine"

import { BindingModel } from "@synthesis/decision-framework/decisions/2.binding-model/binding-meta.model-components"
import * as t from "@synthesis/decision-framework/decisions/2.binding-model/binding-meta.model"
import { Model } from "@synthesis/jsx-runtime"
import { DecisionModel } from "@synthesis/decision-framework/decisions/1.decision-model/decision-meta.model-components"

/**
 * Binding of the relational metamodel to the DDL generation design space.
 * The only issue (IdentifierQuoting) is a global one, so there are no
 * per-element bindings — the default-configuration generator derives one
 * model-wide choice from the decision model alone.
 */
export const Rel_Bindings = (store: ModelStore): ExprNode<t.IBindingModel> => (
  <BindingModel
    name="Rel_Bindings"
    description="Binding relational schema concepts to DDL generation issues"
    sourceModel={<Model $refByName="//www.aelastics.org/RELMetamodel" />}
    decisionModel={<DecisionModel $refByName="//www.aelastics.org/DdlGenerationDesign" />}
    store={store}
  >
  </BindingModel>
)
