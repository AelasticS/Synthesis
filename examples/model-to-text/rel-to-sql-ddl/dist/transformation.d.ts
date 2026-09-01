/** @jsx createExprNode */
import { ExprNode } from "@aelastics/synthesis/jsx-runtime";
import { ModelStore } from "@aelastics/synthesis/engine";
import * as m2tmm from "@aelastics/synthesis/engine";
import * as rmT from "@synthesis/standard-metamodels/relational/model-legacy";
import { DecisionAwareM2M } from "@aelastics/synthesis/decision-framework";
import * as cm from "@aelastics/synthesis/decision-framework/decisions/3.configuration-model/configuration-meta.model";
/**
 * Model-to-text transformation that turns a relational schema into a
 * single-document M2T model containing SQL DDL (CREATE TABLE statements).
 *
 * In Synthesis, text generation is a transformation like any other: the
 * target is the engine's text-document metamodel (M2T, Doc, Sec, P), and
 * the CLI's generate step serializes the documents to files.
 *
 * The relational schema's columns are already named according to the
 * naming convention chosen upstream (snake_case vs camelCase), so this
 * template emits identifiers verbatim. Empty tables (no columns) are
 * skipped.
 *
 * The transformation is decision-aware: the IdentifierQuoting issue of
 * its decision model (decision-model.tsx) selects how table and column
 * identifiers are emitted: verbatim (Unquoted, the default) or wrapped
 * in double quotes (DoubleQuoted).
 */
export declare class Rel2DdlTransformation extends DecisionAwareM2M<rmT.IRelSchema, m2tmm.M2T_Model, {}, cm.IConfigurationModel> {
    constructor(store: ModelStore, extra?: {}, configModel?: cm.IConfigurationModel);
    template(s: rmT.IRelSchema): any;
    tableToCreate(tab: rmT.ITable): ExprNode<m2tmm.ISection>;
    private columnLine;
    quoteIdentifier(name: string): string;
    unquotedIdentifier(name: string): string;
    doubleQuotedIdentifier(name: string): string;
}
