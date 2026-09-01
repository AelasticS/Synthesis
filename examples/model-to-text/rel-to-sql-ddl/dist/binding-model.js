/** @jsx createExprNode */
import { createExprNode } from "@aelastics/synthesis/jsx-runtime";
import { BindingModel } from "@aelastics/synthesis/decision-framework/decisions/2.binding-model/binding-meta.model-components";
import { Model } from "@aelastics/synthesis/jsx-runtime";
import { DecisionModel } from "@aelastics/synthesis/decision-framework/decisions/1.decision-model/decision-meta.model-components";
/**
 * Binding of the relational metamodel to the DDL generation design space.
 * The only issue (IdentifierQuoting) is a global one, so there are no
 * per-element bindings; the default-configuration generator derives one
 * model-wide choice from the decision model alone.
 */
export const Rel_Bindings = (store) => (createExprNode(BindingModel, { name: "Rel_Bindings", description: "Binding relational schema concepts to DDL generation issues", sourceModel: createExprNode(Model, { "$refByName": "//www.aelastics.org/RELMetamodel" }), decisionModel: createExprNode(DecisionModel, { "$refByName": "//www.aelastics.org/DdlGenerationDesign" }), store: store }));
//# sourceMappingURL=binding-model.js.map