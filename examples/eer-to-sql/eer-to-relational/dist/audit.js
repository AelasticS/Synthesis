/** @jsx createExprNode */
/**
 * The higher-order audit template, in the confirmed zero-argument form
 * (2026-09-02, recorded verbatim in design/eer-to-sql-flagship.md):
 * qualifier first, then a columns step in, a columns step out. It is
 * pure target-domain (only relational Column expressions and a name),
 * signature-preserving, and therefore composable: a future
 * withHistoryColumns stacks without design changes.
 */
import { createExprNode } from "@aelastics/synthesis/jsx";
import { Column } from "relational-metamodel";
export const withAuditColumns = (table) => (columns) => () => [
    ...columns(),
    createExprNode(Column, { name: `${table}_createdBy`, type: "VARCHAR(255)", isKey: false, isNullable: false, isAutoincrement: false }),
    createExprNode(Column, { name: `${table}_createdAt`, type: "DATE", isKey: false, isNullable: false, isAutoincrement: false }),
];
//# sourceMappingURL=audit.js.map