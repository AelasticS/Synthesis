/** @jsx createExprNode */
import { ExprNode, ModelStore } from "@synthesis/engine";
import * as t from "@synthesis/decision-framework/decisions/1.decision-model/decision-meta.model";
/**
 * Design space of the Rel to DDL text generation. One global (model-wide)
 * issue: how SQL identifiers are emitted. `Unquoted` is the default and
 * matches the historical output of the transformation; `DoubleQuoted`
 * wraps every table and column identifier in double quotes.
 */
export declare const DdlGenerationIssues: (store: ModelStore) => ExprNode<t.IDecisionModel>;
