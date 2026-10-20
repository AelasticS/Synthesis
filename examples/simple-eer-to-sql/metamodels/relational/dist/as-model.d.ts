/** @jsx createExprNode */
import { ModelStore } from "@aelastics/synthesis/store";
import { ExprNode } from "@aelastics/synthesis/jsx";
import * as t from "@aelastics/synthesis/metamodels/types/model";
/**
 * The simple relational metamodel as a model, mirroring the content of
 * REL.meta.model.type.ts: tables with flat columns (type, key and
 * foreign-key flags, optional reference, nullability, autoincrement),
 * and domains.
 */
export declare const RELModel: (store: ModelStore) => ExprNode<t.ITypeModel>;
