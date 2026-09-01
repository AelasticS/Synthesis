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
import { createExprNode } from '@aelastics/synthesis/jsx';
import { Model } from '@aelastics/synthesis/jsx';
import { BindingModel } from '@aelastics/synthesis/metamodels/binding';
import { DecisionModel } from '@aelastics/synthesis/metamodels/decision';
export const RelTutorialSqlBindings = (store) => (createExprNode(BindingModel, { name: "RelTutorialSqlBindings", description: "Binding the tutorial relational concepts to SQL generation issues", sourceModel: createExprNode(Model, { "$refByName": "//www.aelastics.org/RelTutorialMetamodel" }), decisionModel: createExprNode(DecisionModel, { "$refByName": "//www.aelastics.org/SqlGenerationDesign" }), store: store }));
//# sourceMappingURL=binding-model.js.map