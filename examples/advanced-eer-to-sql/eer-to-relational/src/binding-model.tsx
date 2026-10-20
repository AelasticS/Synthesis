/** @jsx createExprNode */

/**
 * The binding model: connects decision-model issues to the metamodel
 * concepts they apply to. References are absolute store paths into the
 * ERMetamodel part (rendered before this model, see synth.json parts
 * order) and into the decision model. The optional condition narrows an
 * element issue to the elements it really concerns; here,
 * OneToManyStrategy applies only to relationships that are 1:N.
 * Binding matches by the concrete type name of a source element, so
 * TableAuditing binds Kernel, Weak, and Subtype separately.
 */
import { createExprNode } from "@aelastics/synthesis/jsx"
import { ExprNode } from "@aelastics/synthesis/jsx"
import { ModelStore } from "@aelastics/synthesis/store"

import { BindingModel, Binding } from "@aelastics/synthesis/metamodels/binding"
import * as t from "@aelastics/synthesis/metamodels/binding/model"
import { Model, Element as ModelElement } from "@aelastics/synthesis/jsx"
import { DecisionModel, ElementLevelIssue } from "@aelastics/synthesis/metamodels/decision"

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
        <ElementLevelIssue $refByName="//www.aelastics.org/RelationSchemaDesign/PrimaryKeyStrategy" />,
      ]}
    />

    <Binding
      name="OneToManyBinding"
      description="Binding 1:N Relationship Strategy to EER Model"
      element={<ModelElement $refByName="//www.aelastics.org/ERMetamodel/Relationship" />}
      issues={[
        <ElementLevelIssue $refByName="//www.aelastics.org/RelationSchemaDesign/OneToManyStrategy" />,
      ]}

      condition='return (e) => {
                if (!e.roles || e.roles.length !== 2) return false;
                const m1 = e.roles[0];
                const m2 = e.roles[1];
                return (m1.upperBound === "1" && m1.lowerBound === "0" && m2.upperBound === "M") ||
                       (m1.upperBound === "M" && m2.upperBound === "1" && m2.lowerBound === "0");
            }'
    />

    <Binding
      name="KernelAuditingBinding"
      description="Binding table auditing to kernel entities"
      element={<ModelElement $refByName="//www.aelastics.org/ERMetamodel/Kernel" />}
      issues={[
        <ElementLevelIssue $refByName="//www.aelastics.org/RelationSchemaDesign/TableAuditing" />,
      ]}
    />

    <Binding
      name="WeakAuditingBinding"
      description="Binding table auditing to weak entities"
      element={<ModelElement $refByName="//www.aelastics.org/ERMetamodel/Weak" />}
      issues={[
        <ElementLevelIssue $refByName="//www.aelastics.org/RelationSchemaDesign/TableAuditing" />,
      ]}
    />

    <Binding
      name="SubtypeAuditingBinding"
      description="Binding table auditing to subtype entities"
      element={<ModelElement $refByName="//www.aelastics.org/ERMetamodel/Subtype" />}
      issues={[
        <ElementLevelIssue $refByName="//www.aelastics.org/RelationSchemaDesign/TableAuditing" />,
      ]}
    />

    <Binding
      name="InheritanceBinding"
      description="Binding the inheritance strategy to specialization hierarchies"
      element={<ModelElement $refByName="//www.aelastics.org/ERMetamodel/Specialization" />}
      issues={[
        <ElementLevelIssue $refByName="//www.aelastics.org/RelationSchemaDesign/InheritanceStrategy" />,
      ]}
    />

    {/* Row history binds to the entities pass's table owners: kernels,
        weak entities, and aggregations. The HistoryDiscriminator
        sub-issue is deliberately NOT bound: a sub-issue attaches
        through its parent option, which keeps default configurations
        quiet about it while NoHistory rules. */}
    <Binding
      name="KernelHistoryBinding"
      description="Binding row history to kernel entities"
      element={<ModelElement $refByName="//www.aelastics.org/ERMetamodel/Kernel" />}
      issues={[
        <ElementLevelIssue $refByName="//www.aelastics.org/RelationSchemaDesign/RowHistory" />,
      ]}
    />

    <Binding
      name="WeakHistoryBinding"
      description="Binding row history to weak entities"
      element={<ModelElement $refByName="//www.aelastics.org/ERMetamodel/Weak" />}
      issues={[
        <ElementLevelIssue $refByName="//www.aelastics.org/RelationSchemaDesign/RowHistory" />,
      ]}
    />

    <Binding
      name="AggregationHistoryBinding"
      description="Binding row history to aggregations"
      element={<ModelElement $refByName="//www.aelastics.org/ERMetamodel/Aggregation" />}
      issues={[
        <ElementLevelIssue $refByName="//www.aelastics.org/RelationSchemaDesign/RowHistory" />,
      ]}
    />
  </BindingModel>
)
