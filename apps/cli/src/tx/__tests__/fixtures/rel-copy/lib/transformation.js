/**
 * Endogenous relational -> relational copy transformation. Exists so the
 * CLI test suite has an m2m step whose source and target metamodels are
 * identical: it can follow eer-to-relational in a chain (testing
 * provenance of a step fed by an intermediate) and can be chained with
 * itself (testing ref-collision pre-flight checks).
 *
 * Written as plain JS (no JSX, no decorators): the JSX factory is called
 * directly and abstractM2M provides transform(), trace handling, and the
 * serialized target JSX the CLI persists.
 */
import { createExprNode } from '@aelastics/synthesis/jsx-runtime'
import { abstractM2M } from '@aelastics/synthesis/engine'
import * as rmT from '@synthesis/standard-metamodels/relational/model-legacy'
import { RelSchema, Table, Column } from '@synthesis/standard-metamodels/relational/components-legacy'

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
              isForeignKey: c.isForeignKey,
              isNullable: c.isNullable,
              ...(c.references ? { references: c.references } : {})
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
