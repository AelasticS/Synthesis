/** @jsx createExprNode */
import * as jsx_1 from "@aelastics/synthesis/jsx";
import * as binding_1 from "@aelastics/synthesis/metamodels/binding";
import * as jsx_2 from "@aelastics/synthesis/jsx";
import * as decision_1 from "@aelastics/synthesis/metamodels/decision";
/**
 * Binding of the relational metamodel to the DDL generation design space.
 * The only issue (IdentifierQuoting) is a global one, so there are no
 * per-element bindings — the default-configuration generator derives one
 * model-wide choice from the decision model alone.
 */
const Rel_Bindings = (store) => ((0, jsx_1.createExprNode)(binding_1.BindingModel, { name: "Rel_Bindings", description: "Binding relational schema concepts to DDL generation issues", sourceModel: (0, jsx_1.createExprNode)(jsx_2.Model, { "$refByName": "//www.aelastics.org/RELMetamodel" }), decisionModel: (0, jsx_1.createExprNode)(decision_1.DecisionModel, { "$refByName": "//www.aelastics.org/DdlGenerationDesign" }), store: store }));
export { Rel_Bindings };