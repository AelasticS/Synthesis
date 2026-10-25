/** @jsx createExprNode */
/**
 * The EER metamodel expressed as a types-metamodel model. It ships with
 * the transformation as a manifest part and is rendered into the store
 * before every run.
 */
import { ModelStore } from "@aelastics/synthesis/store";
import { ExprNode } from "@aelastics/synthesis/jsx";
import * as t from "@aelastics/synthesis/metamodels/types/model";
export declare const EERModel: (store: ModelStore) => ExprNode<t.ITypeModel>;
