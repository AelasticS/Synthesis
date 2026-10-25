/** @jsx createExprNode */
import { ExprNode } from "@aelastics/synthesis/jsx";
import { ModelStore } from "@aelastics/synthesis/store";
import * as t from "@aelastics/synthesis/metamodels/decision/model";
/**
 * Design space of the Rel to DDL text generation. Global issues: how
 * SQL identifiers are emitted, how referential rules reach the DDL
 * (native action clauses or trigger emulation), how domains are
 * rendered (CREATE DOMAIN or inlined base types with checks), and
 * which SQL dialect flavors the physical emissions. One per-table
 * issue: whether the table is physically clustered by its primary
 * key. A dialect is not code anywhere here: the shipped presets are
 * configuration models closing these issues (see presets/).
 */
export declare const DdlGenerationIssues: (store: ModelStore) => ExprNode<t.IDecisionModel>;
