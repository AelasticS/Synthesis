/** @jsx createExprNode */
import type { ExprNode } from '@aelastics/synthesis/jsx';
import type { ModelStore } from '@aelastics/synthesis/store';
export declare const globalChoice: (issue: string, option: string) => any;
/** The standard-sql choice set: portable SQL, every issue closed. */
export declare const standardSqlChoices: () => Record<string, string>;
/** A whole preset model over a choice set. The source-model slot names
 * the relational metamodel: a preset configures models of a metamodel,
 * not one model, and the run accepts it for any input (its header
 * declares no source reference). */
export declare const presetModel: (name: string, choices: Record<string, string>) => (store: ModelStore) => ExprNode<never>;
