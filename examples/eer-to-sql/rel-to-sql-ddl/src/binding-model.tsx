/** @jsx createExprNode */

import { createExprNode } from "@aelastics/synthesis/jsx"
import { ExprNode } from "@aelastics/synthesis/jsx"
import { ModelStore } from "@aelastics/synthesis/store"

import { BindingModel } from "@aelastics/synthesis/metamodels/binding"
import * as t from "@aelastics/synthesis/metamodels/binding/model"
import { Model } from "@aelastics/synthesis/jsx"
import { DecisionModel } from "@aelastics/synthesis/metamodels/decision"

/**
 * Binding of the relational metamodel to the DDL generation design space.
 * The only issue (IdentifierQuoting) is a global one, so there are no
 * per-element bindings; the default-configuration generator derives one
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
