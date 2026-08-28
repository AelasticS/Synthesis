/** @jsx createExprNode */

/**
 * The binding model: connects decision-model issues to the metamodel
 * concepts they apply to. References are absolute store paths into the
 * ERMetamodel part (rendered before this model, see synth.json parts
 * order) and into the decision model. The optional condition narrows an
 * element issue to the elements it really concerns; here,
 * OneToManyStrategy applies only to relationships that are 1:N.
 */
import { createExprNode } from "@synthesis/jsx-runtime"
import { ExprNode } from "@synthesis/jsx-runtime"
import { ModelStore } from "@synthesis/engine"

import { BindingModel, Binding } from "@synthesis/decision-framework/decisions/2.binding-model/binding-meta.model-components"
import * as t from "@synthesis/decision-framework/decisions/2.binding-model/binding-meta.model"
import { Model, Element as ModelElement } from "@synthesis/jsx-runtime"
import { DecisionModel, ElementIssue } from "@synthesis/decision-framework/decisions/1.decision-model/decision-meta.model-components"

export const ER_Bindings = (store: ModelStore): ExprNode<t.IBindingModel> => (
  <BindingModel
    name="ER_Bindings"
    description="Binding EER Model concepts to relation schema design issues"
    sourceModel={<Model $refByName="//www.aelastics.org/ERMetamodel" />}
    decisionModel={<DecisionModel $refByName="//www.aelastics.org/RelationSchemaDesign" />}
    store={store}
  >
    <Binding
      name="PKStrategyBinding"
      description="Binding Primary Key Strategy to EER Model"
      element={<ModelElement $refByName="//www.aelastics.org/ERMetamodel/Attribute" />}
      issues={[
        <ElementIssue $refByName="//www.aelastics.org/RelationSchemaDesign/PrimaryKeyStrategy" />,
      ]}
    />

    <Binding
      name="OneToManyBinding"
      description="Binding 1:N Relationship Strategy to EER Model"
      element={<ModelElement $refByName="//www.aelastics.org/ERMetamodel/Relationship" />}
      issues={[
        <ElementIssue $refByName="//www.aelastics.org/RelationSchemaDesign/OneToManyStrategy" />,
      ]}

      condition='return (e) => {
                if (!e.roles || e.roles.length !== 2) return false;
                const m1 = e.roles[0];
                const m2 = e.roles[1];
                return (m1.ub === "1" && m1.lb === "0" && m2.ub === "M") ||
                       (m1.ub === "M" && m2.ub === "1" && m2.lb === "0");
            }'
    />
  </BindingModel>
)
