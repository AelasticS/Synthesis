/** @jsx createExprNode */
import { ModelStore } from "@aelastics/synthesis/store";
import { ExprNode } from "@aelastics/synthesis/jsx";
import * as t from "@aelastics/synthesis/metamodels/types/model";
/**
 * The simple relational metamodel as a model, mirroring the content of
 * REL.meta.model.type.ts: tables with columns, foreign keys (composite
 * capable, via ForeignKeyColumn pairs), and indexes. Links that would
 * point forward to a type defined later (Column.indexes, the
 * referencedTable of a ForeignKey) are omitted so definition order
 * stays acyclic.
 */
export declare const RELModel: (store: ModelStore) => ExprNode<t.ITypeModel>;
