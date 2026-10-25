/** @jsx createExprNode */

/**
 * The higher-order audit template in the confirmed simplified form
 * (2026-09-06, decision 10 of design/eer-to-relational-v2.md, which
 * supersedes the qualified form of v1): a columns step in, a columns
 * step out, no table qualifier, because the table scopes its columns'
 * names and every table can carry its own createdBy and createdAt. It
 * is pure target-domain, signature-preserving, and therefore
 * composable: withHistoryTable (history.tsx) stacks one granularity
 * above it, capturing these columns in the history table like any
 * other.
 */
import { createExprNode } from "@aelastics/synthesis/jsx"
import type { ExprNode } from "@aelastics/synthesis/jsx"
import * as rmT from "relational-metamodel/model"
import { Column } from "relational-metamodel"

export const withAuditColumns = (columns: () => ExprNode<rmT.IColumn>[]) =>
  (): ExprNode<rmT.IColumn>[] => [
    ...columns(),
    <Column name="createdBy" type="VARCHAR(255)" isNullable={false} isAutoincrement={false} />,
    <Column name="createdAt" type="DATE" isNullable={false} isAutoincrement={false} />,
  ]
