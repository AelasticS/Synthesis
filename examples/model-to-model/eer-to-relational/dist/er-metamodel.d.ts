/** @jsx createExprNode */
/**
 * The EER metamodel expressed as a types-metamodel model. It ships with
 * the transformation as a manifest part and is rendered into the store
 * before the decision and binding models, so the binding model can
 * reference its concepts (Attribute, Relationship) by absolute path.
 */
import { ModelStore } from "@synthesis/engine";
import { ExprNode } from "@synthesis/jsx-runtime";
import * as t from "@synthesis/standard-metamodels/types-metamodel/model";
export declare const EERModel: (store: ModelStore) => ExprNode<t.ITypeModel>;
