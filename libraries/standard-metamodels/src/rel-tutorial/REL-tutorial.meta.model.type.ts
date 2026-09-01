/*
 * Simplified relational metamodel for the developer-guide tutorial. It
 * is the target of the model-to-model tutorial, and it carries only what
 * the tutorial needs: tables of columns, where a column may reference
 * the primary key column it points at.
 *
 * Deliberately excluded, because they belong to the full relational
 * metamodel rather than to a first transformation: composite foreign
 * keys (a reference here is a single column link, so composites cannot
 * even be expressed), foreign key constraints as first class elements,
 * and indexes.
 *
 * Note that there is no `isForeignKey` flag. A column is a foreign key
 * exactly when it references another column, so the fact is derived
 * from the model rather than stored beside it, where the two could
 * disagree.
 */
import * as t from "@aelastics/types"

import { ModelElement, Model } from "@aelastics/synthesis/metamodel-core"

export const RelTutorial_TypeSchema = t.schema("RelTutorialSchema")

export const RelSchema = t.subtype(Model, {}, "RelSchema", RelTutorial_TypeSchema)

export const Column = t.subtype(
  ModelElement,
  {
    type: t.string,
    isKey: t.boolean,
    isNullable: t.boolean,
    isAutoincrement: t.boolean,
    // The primary key column this column points at, when it is a
    // foreign key. One column, never several: the tutorial does not
    // model composite keys.
    references: t.optional(t.link(RelTutorial_TypeSchema, "Column")),
  },
  "Column",
  RelTutorial_TypeSchema
)

export const Table = t.subtype(
  ModelElement,
  {
    columns: t.arrayOf(Column),
  },
  "Table",
  RelTutorial_TypeSchema
)

export type IRelSchema = t.TypeOf<typeof RelSchema>
export type IColumn = t.TypeOf<typeof Column>
export type ITable = t.TypeOf<typeof Table>
