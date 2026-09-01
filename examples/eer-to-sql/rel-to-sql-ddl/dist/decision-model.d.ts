/** @jsx createExprNode */
import { ExprNode } from "@aelastics/synthesis/jsx";
import { ModelStore } from "@aelastics/synthesis/store";
import * as t from "@aelastics/synthesis/metamodels/decision/model";
/**
 * Design space of the Rel to DDL text generation. One global (model-wide)
 * issue: how SQL identifiers are emitted. `Unquoted` is the default and
 * matches the historical output of the transformation; `DoubleQuoted`
 * wraps every table and column identifier in double quotes.
 */
export declare const DdlGenerationIssues: (store: ModelStore) => ExprNode<t.IDecisionModel>;
