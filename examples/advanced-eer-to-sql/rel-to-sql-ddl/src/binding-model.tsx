/** @jsx createExprNode */

import { createExprNode } from "@aelastics/synthesis/jsx"
import { ExprNode } from "@aelastics/synthesis/jsx"
import { ModelStore } from "@aelastics/synthesis/store"

import { BindingModel, Binding } from "@aelastics/synthesis/metamodels/binding"
import * as t from "@aelastics/synthesis/metamodels/binding/model"
import { Model, Element as ModelElement } from "@aelastics/synthesis/jsx"
import { DecisionModel, ElementLevelIssue } from "@aelastics/synthesis/metamodels/decision"

/**
 * Binding of the relational metamodel to the DDL generation design
 * space. The global issues need no bindings; the per-table Clustering
 * issue binds to the Table concept, so configurations carry one
 * clustering choice per table of the source schema.
 */
export const Rel_Bindings = (store: ModelStore): ExprNode<t.IBindingModel> => (
  <BindingModel
    name="Rel_Bindings"
    description="Binding relational schema concepts to DDL generation issues"
    sourceModel={<Model $refByName="//www.aelastics.org/RELMetamodel" />}
    decisionModel={<DecisionModel $refByName="//www.aelastics.org/DdlGenerationDesign" />}
    store={store}
  >
    <Binding
      name="ClusteringBinding"
      description="Binding the per-table Clustering issue to Table"
      element={<ModelElement $refByName="//www.aelastics.org/RELMetamodel/Table" />}
      issues={[
        <ElementLevelIssue $refByName="//www.aelastics.org/DdlGenerationDesign/Clustering" />,
      ]}
    />
  </BindingModel>
)
