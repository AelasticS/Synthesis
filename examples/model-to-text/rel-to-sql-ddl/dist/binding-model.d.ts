/** @jsx createExprNode */
import { ExprNode } from "@synthesis/jsx-runtime";
import { ModelStore } from "@synthesis/engine";
import * as t from "@synthesis/decision-framework/decisions/2.binding-model/binding-meta.model";
/**
 * Binding of the relational metamodel to the DDL generation design space.
 * The only issue (IdentifierQuoting) is a global one, so there are no
 * per-element bindings; the default-configuration generator derives one
 * model-wide choice from the decision model alone.
 */
export declare const Rel_Bindings: (store: ModelStore) => ExprNode<t.IBindingModel>;
