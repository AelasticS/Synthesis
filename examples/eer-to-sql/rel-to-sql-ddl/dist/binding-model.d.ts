/** @jsx createExprNode */
import { ExprNode } from "@aelastics/synthesis/jsx";
import { ModelStore } from "@aelastics/synthesis/store";
import * as t from "@aelastics/synthesis/metamodels/binding/model";
/**
 * Binding of the relational metamodel to the DDL generation design space.
 * The only issue (IdentifierQuoting) is a global one, so there are no
 * per-element bindings; the default-configuration generator derives one
 * model-wide choice from the decision model alone.
 */
export declare const Rel_Bindings: (store: ModelStore) => ExprNode<t.IBindingModel>;
