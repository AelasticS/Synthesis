/**
 * Endogenous relational -> relational copy transformation over the
 * tutorial relational metamodel (rel-tutorial-metamodel). Exists so the
 * CLI test suite has an m2m step whose source and target metamodels are
 * identical: chained with itself it exercises ref-collision pre-flight
 * checks and the provenance of a step fed by an intermediate.
 *
 * Written as plain JS (no JSX, no decorators), the way a compiled package
 * ships: the JSX factory is called directly and abstractM2M provides
 * transform(), trace handling, and the serialized target JSX the CLI
 * persists.
 */
import { createExprNode } from '@aelastics/synthesis/jsx'
import { abstractM2M } from '@aelastics/synthesis/m2m'
import * as rmT from 'rel-tutorial-metamodel/model'
import { RelSchema, Table, Column } from 'rel-tutorial-metamodel'

export class RelCopyTransformation extends abstractM2M {
  constructor(store) {
    super(store)
  }

  template(s) {
    const tables = s.elements
      .filter((el) => this.context.store.isTypeOf(el, rmT.Table))
      .map((tab) =>
        createExprNode(
          Table,
          { name: tab.name },
          ...(tab.columns || []).map((c) =>
            createExprNode(Column, {
              name: c.name,
              type: c.type,
              isKey: c.isKey,
              isAutoincrement: c.isAutoincrement,
              isNullable: c.isNullable,
              // A column is a foreign key exactly when it references the
              // key column of another table; the copy re-links by name
              // inside the copied schema (column names are copied 1:1).
              ...(c.references ? { references: createExprNode(Column, { $refByName: c.references.name }) } : {})
            })
          )
        )
      )
    return createExprNode(
      RelSchema,
      { name: `${s.name}_copy`, content: '', MDA_level: 'M1', store: this.context.store },
      ...tables
    )
  }
}
