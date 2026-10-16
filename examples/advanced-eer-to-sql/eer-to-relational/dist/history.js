/** @jsx createExprNode */
/**
 * The higher-order row-history template, one granularity above
 * withAuditColumns (design/row-history.md): a table step in, a
 * table-SET step out, the base table followed by its derived history
 * table. It is pure target-domain and derives the history table by
 * introspecting the base table's expression node, so it composes with
 * whatever produced that node; the audit columns appended inside the
 * wrapped step are captured like any other column.
 *
 * The history table is identified like a weak entity, base key plus a
 * temporal discriminator, but is deliberately NOT existence-dependent:
 * it carries no foreign keys at all, because history outlives the
 * deletion of the base row and a snapshot of a past state must not be
 * rejected by current referential constraints.
 */
import { createExprNode } from "@aelastics/synthesis/jsx";
import * as rmT from "relational-metamodel/model";
import { Column, Domain as RelDomain, PrimaryKey, Table } from "relational-metamodel";
/** The real columns of a table node: Column children carrying props,
 * not the $refByName references a PrimaryKey or Index holds. */
export const columnNodesOf = (table) => table.childArray.flat(Infinity).filter((n) => n?.type === rmT.Column && n.props.$refByName === undefined);
const primaryKeyNodeOf = (table) => table.childArray.flat(Infinity).find((n) => n?.type === rmT.PrimaryKey);
/** A history copy of a column node: same name, type, nullability, and
 * domain reference; autoincrement stripped, because history rows
 * arrive with their values. */
export const copiedHistoryColumn = (c) => {
    const p = c.props;
    const domainRef = p.domain?.props?.$refByName;
    return (createExprNode(Column, { name: String(p.name), type: String(p.type), isNullable: p.isNullable === true, isAutoincrement: false, ...(domainRef !== undefined ? { domain: createExprNode(RelDomain, { "$refByName": domainRef }) } : {}) }));
};
export const withHistoryTable = (discriminator) => (table) => () => {
    const base = table();
    const baseName = String(base.props.name);
    const historyName = `${baseName}_history`;
    const disc = discriminator();
    const keyRefs = (primaryKeyNodeOf(base)?.childArray.flat(Infinity) ?? []);
    return [
        base,
        createExprNode(Table, { name: historyName, historyOf: createExprNode(Table, { "$refByName": baseName }) },
            columnNodesOf(base).map((c) => copiedHistoryColumn(c)),
            disc,
            createExprNode(PrimaryKey, { name: `pk_${historyName}` },
                keyRefs.map((k) => (createExprNode(Column, { "$refByName": String(k.props.$refByName) }))),
                createExprNode(Column, { "$refByName": String(disc.props.name) }))),
    ];
};
//# sourceMappingURL=history.js.map