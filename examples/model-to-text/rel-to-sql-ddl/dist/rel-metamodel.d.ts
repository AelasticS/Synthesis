/** @jsx createExprNode */
import { ModelStore } from "@aelastics/synthesis/engine";
import { ExprNode } from "@aelastics/synthesis/jsx-runtime";
import * as t from "@aelastics/synthesis/metamodels/types/model";
/**
 * Minimal relational metamodel model, mirroring er-metamodel.tsx of the
 * eer-to-relational example. Its role here is to stand for the source
 * metamodel of the Rel to DDL transformation so the DDL binding model
 * has a real sourceModel to reference, the same way ER_Bindings
 * references ERMetamodel.
 */
export declare const RELModel: (store: ModelStore) => ExprNode<t.ITypeModel>;
