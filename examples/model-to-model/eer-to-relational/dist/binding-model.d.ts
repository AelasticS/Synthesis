/** @jsx createExprNode */
import { ExprNode } from "@synthesis/jsx-runtime";
import { ModelStore } from "@synthesis/engine";
import * as t from "@synthesis/decision-framework/decisions/2.binding-model/binding-meta.model";
export declare const ER_Bindings: (store: ModelStore) => ExprNode<t.IBindingModel>;
