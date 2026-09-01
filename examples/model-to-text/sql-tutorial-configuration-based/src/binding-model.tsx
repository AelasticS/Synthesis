/** @jsx createExprNode */

/**
 * Binding of the tutorial relational metamodel to the SQL generation
 * design space. Both issues are global, so there are no per-element
 * bindings and the body is empty: a global issue is answered once for
 * the whole model, and the default-configuration generator derives that
 * one choice from the decision model alone.
 *
 * The model still has to exist. It is what names the two ends the
 * decision machinery works across, and the references are absolute store
 * paths into the metamodel part and the decision model, both rendered
 * before this model in the order the manifest's `parts` block lists
 * them.
 */
import { createExprNode } from '@synthesis/jsx-runtime'
import type { ExprNode } from '@synthesis/jsx-runtime'
import type { ModelStore } from '@synthesis/engine'
import { Model } from '@synthesis/jsx-runtime'
import { BindingModel } from '@synthesis/decision-framework/decisions/2.binding-model/binding-meta.model-components'
import type * as t from '@synthesis/decision-framework/decisions/2.binding-model/binding-meta.model'
import { DecisionModel } from '@synthesis/decision-framework/decisions/1.decision-model/decision-meta.model-components'

export const RelTutorialSqlBindings = (store: ModelStore): ExprNode<t.IBindingModel> => (
  <BindingModel
    name="RelTutorialSqlBindings"
    description="Binding the tutorial relational concepts to SQL generation issues"
    sourceModel={<Model $refByName="//www.aelastics.org/RelTutorialMetamodel" />}
    decisionModel={<DecisionModel $refByName="//www.aelastics.org/SqlGenerationDesign" />}
    store={store}
  >
  </BindingModel>
)
