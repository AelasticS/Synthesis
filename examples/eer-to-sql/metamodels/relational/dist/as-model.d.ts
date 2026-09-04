/** @jsx createExprNode */
import { ModelStore } from "@aelastics/synthesis/store";
import { ExprNode } from "@aelastics/synthesis/jsx";
import * as t from "@aelastics/synthesis/metamodels/types/model";
/**
 * The relational metamodel as a model, mirroring the rich content of
 * model.ts: tables with columns, foreign keys (composite capable via
 * ForeignKeyColumn pairs), and indexes. Its role is to stand for the
 * source metamodel of the Rel to DDL transformation so the DDL binding
 * model has a real sourceModel to reference, the same way ER_Bindings
 * references ERMetamodel.
 */
export declare const RELModel: (store: ModelStore) => ExprNode<t.ITypeModel>;
