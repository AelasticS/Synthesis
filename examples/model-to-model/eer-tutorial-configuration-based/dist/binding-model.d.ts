/** @jsx createExprNode */
import type { ExprNode } from '@synthesis/jsx-runtime';
import type { ModelStore } from '@synthesis/engine';
import type * as t from '@synthesis/decision-framework/decisions/2.binding-model/binding-meta.model';
export declare const EERTutorialBindings: (store: ModelStore) => ExprNode<t.IBindingModel>;
