/** @jsx createExprNode */

import { createExprNode } from "@aelastics/synthesis/jsx"
import { ExprNode } from "@aelastics/synthesis/jsx"
import { ModelStore } from "@aelastics/synthesis/store"

import { BindingModel, Binding } from "@aelastics/synthesis/metamodels/binding"
import * as t from "@aelastics/synthesis/metamodels/binding/model"
import { Model, Element as ModelElement } from "@aelastics/synthesis/jsx"
import { DecisionModel, ElementIssue } from "@aelastics/synthesis/metamodels/decision"


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
