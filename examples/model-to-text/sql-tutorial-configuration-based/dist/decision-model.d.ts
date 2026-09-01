/** @jsx createExprNode */
import type { ExprNode, ModelStore } from '@aelastics/synthesis/engine';
import type * as t from '@aelastics/synthesis/decision-framework/decisions/1.decision-model/decision-meta.model';
export declare const SqlGenerationIssues: (store: ModelStore) => ExprNode<t.IDecisionModel>;
