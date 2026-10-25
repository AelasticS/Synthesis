/** @jsx createExprNode */
import { ExprNode } from "@aelastics/synthesis/jsx";
import { ModelStore } from "@aelastics/synthesis/store";
import * as t from "@aelastics/synthesis/metamodels/binding/model";
/**
 * Binding of the relational metamodel to the DDL generation design
 * space. The global issues need no bindings; the per-table Clustering
 * issue binds to the Table concept, so configurations carry one
 * clustering choice per table of the source schema.
 */
export declare const Rel_Bindings: (store: ModelStore) => ExprNode<t.IBindingModel>;
