/** @jsx createExprNode */
import { ModelStore } from "@synthesis/engine";
import { ExprNode } from "@synthesis/jsx-runtime";
import * as t from "@synthesis/standard-metamodels/types-metamodel/model";
/**
 * Minimal relational metamodel model, mirroring er-metamodel.tsx of the
 * eer-to-relational example. Its role here is to stand for the source
 * metamodel of the Rel to DDL transformation so the DDL binding model
 * has a real sourceModel to reference, the same way ER_Bindings
 * references ERMetamodel.
 */
export declare const RELModel: (store: ModelStore) => ExprNode<t.ITypeModel>;
