/** @jsx createExprNode */
import { ExprNode } from "@aelastics/synthesis/jsx";
import { ModelStore } from "@aelastics/synthesis/store";
import * as m2tmm from "@aelastics/synthesis/m2t";
import * as rmT from "relational-metamodel/model";
import { DecisionAwareM2M } from "@aelastics/synthesis/variability";
import * as cm from "@aelastics/synthesis/metamodels/configuration/model";
/**
 * Model-to-text transformation that turns a rich relational schema into
 * SQL DDL: CREATE TABLE statements with composite-aware PRIMARY KEY
 * clauses (read from the PrimaryKey element, in its order), named
 * foreign key constraints as ALTER TABLE statements in a separate
 * section (foreign keys can be circular, so no creation order can
 * satisfy them inline), CREATE INDEX statements, domain rendering per
 * the DomainHandling issue, referential rules per ReferentialActions
 * (native clauses or trigger emulation; connect rules are always
 * triggers, no dialect has a declarative form), row-history capture
 * stubs for every table carrying historyOf (equally unconditional),
 * and physical clustering per the per-table Clustering issue flavored
 * by SqlDialect. Identifiers are emitted per IdentifierQuoting.
 */
export declare class Rel2DdlTransformation extends DecisionAwareM2M<rmT.IRelSchema, m2tmm.M2T_Model, {}, cm.IConfigurationModel> {
    constructor(store: ModelStore, extra?: {}, configModel?: cm.IConfigurationModel);
    main(s: rmT.IRelSchema): any;
    /** The one-time CLUSTER statements PostgreSQL offers (no maintained
     * clustered indexes there; re-running CLUSTER refreshes the order). */
    private postgresClusterSection;
    /** The triggers document: connect rules always land here (no dialect
     * expresses them declaratively); under TriggerEmulation the
     * disconnect rules join them, and history capture stubs land here
     * unconditionally for every table carrying historyOf. The bodies are
     * named stubs: the rule, its event, and its meaning are the
     * generated contract. */
    triggersDocument(s: rmT.IRelSchema, connectFks: rmT.IForeignKey[], emulatedFks: rmT.IForeignKey[], historyTables: rmT.ITable[]): ExprNode<m2tmm.IDocument>;
    /** The row-history capture stub, unconditional like the connect
     * rules: no dialect maintains a history table declaratively, so
     * every update or delete on the base table writes the previous row
     * state (with its discriminator value) through the named
     * procedure. */
    private captureTrigger;
    private connectTrigger;
    private disconnectTrigger;
    tableToCreate(tab: rmT.ITable): ExprNode<m2tmm.ISection>;
    foreignKeyToAlter(fk: rmT.IForeignKey): ExprNode<m2tmm.ISection>;
    private actionSql;
    indexToCreate(ix: rmT.IIndex): ExprNode<m2tmm.ISection>;
    private columnLine;
    /** The domain statements section: nothing inline, CREATE DOMAIN when
     * domains are emitted. */
    domainsHandling(domains: rmT.IDomain[]): ExprNode<m2tmm.ISection>[];
    inlineNoDomainStatements(domains: rmT.IDomain[]): ExprNode<m2tmm.ISection>[];
    emitDomainStatements(domains: rmT.IDomain[]): ExprNode<m2tmm.ISection>[];
    /** A domain-linked column's type text: the base type inline, or the
     * domain's name when domains are emitted. */
    columnTypeText(c: rmT.IColumn): string;
    inlineColumnType(c: rmT.IColumn): string;
    domainColumnType(c: rmT.IColumn): string;
    /** A domain-linked column's inline clauses: DEFAULT and CHECK carried
     * onto the column when types are inlined (VALUE becomes the column's
     * identifier), nothing when the domain statement carries them. */
    columnDomainClauses(c: rmT.IColumn): {
        default?: string;
        check?: string;
    };
    inlineDomainClauses(c: rmT.IColumn): {
        default?: string;
        check?: string;
    };
    noInlineDomainClauses(c: rmT.IColumn): {
        default?: string;
        check?: string;
    };
    /** The action clauses appended to a FOREIGN KEY line. */
    fkActionClauses(fk: rmT.IForeignKey): string;
    nativeActionClauses(fk: rmT.IForeignKey): string;
    noActionClauses(fk: rmT.IForeignKey): string;
    /** Which foreign keys need disconnect triggers: none natively, the
     * action-carrying ones under emulation. */
    disconnectTriggerFks(fks: rmT.IForeignKey[]): rmT.IForeignKey[];
    noDisconnectTriggers(fks: rmT.IForeignKey[]): rmT.IForeignKey[];
    emulatedDisconnectTriggers(fks: rmT.IForeignKey[]): rmT.IForeignKey[];
    /** The dialect flavoring the physical emissions. */
    dialect(): "standard" | "postgres" | "oracle";
    standardDialect(): "standard";
    postgresDialect(): "postgres";
    oracleDialect(): "oracle";
    /** The per-table clustering decision. */
    clusteringOf(tab: rmT.ITable): "none" | "pk";
    noClustering(tab: rmT.ITable): "none";
    clusterByPrimaryKey(tab: rmT.ITable): "pk";
    /** Oracle keeps a clustered table clustered: the same logical choice
     * becomes an index-organized table at creation. */
    private tableOrganizationSuffix;
    quoteIdentifier(name: string): string;
    unquotedIdentifier(name: string): string;
    doubleQuotedIdentifier(name: string): string;
}
