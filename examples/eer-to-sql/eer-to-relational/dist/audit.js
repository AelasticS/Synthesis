/** @jsx createExprNode */
/**
 * The higher-order audit template in the confirmed simplified form
 * (2026-09-06, decision 10 of design/eer-to-relational-v2.md, which
 * supersedes the qualified form of v1): a columns step in, a columns
 * step out, no table qualifier, because the table scopes its columns'
 * names and every table can carry its own createdBy and createdAt. It
 * is pure target-domain, signature-preserving, and therefore
 * composable: a future withHistoryColumns stacks without design
 * changes.
 */
import { createExprNode } from "@aelastics/synthesis/jsx";
import { Column } from "relational-metamodel";
export const withAuditColumns = (columns) => () => [
    ...columns(),
    createExprNode(Column, { name: "createdBy", type: "VARCHAR(255)", isNullable: false, isAutoincrement: false }),
    createExprNode(Column, { name: "createdAt", type: "DATE", isNullable: false, isAutoincrement: false }),
];
//# sourceMappingURL=audit.js.map