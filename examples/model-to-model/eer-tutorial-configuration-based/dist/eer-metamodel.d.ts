/** @jsx createExprNode */
/**
 * The tutorial EER metamodel expressed as a types-metamodel model. It
 * ships with the transformation as a manifest part and is rendered into
 * the store before the decision and binding models, so the binding model
 * can reference its concepts by absolute path.
 *
 * Only the concepts the binding model has to name are declared here.
 * The transformation itself works against the real metamodel package
 * (@synthesis/standard-metamodels/eer-tutorial/advanced); this model is
 * the vocabulary the decision machinery talks about, not a second
 * definition of the language.
 */
import type { ModelStore } from '@synthesis/engine';
import type { ExprNode } from '@synthesis/jsx-runtime';
import type * as t from '@synthesis/standard-metamodels/types-metamodel/model';
export declare const EERTutorialMetamodel: (store: ModelStore) => ExprNode<t.ITypeModel>;
