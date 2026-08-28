/**
 * Starter transformation: copies a relational schema unchanged. It
 * builds, installs, and runs as-is, so you always have a working
 * baseline; make it yours step by step:
 *
 * 1. Rename the class, and keep synth.json's exportName in sync.
 * 2. Point synth.json's source and target at your metamodels, and
 *    replace the imports below accordingly.
 * 3. Implement template(): map the source model onto an expression
 *    tree built from the target metamodel's components.
 *
 * The tutorial walks through every step, and the examples/ catalog in
 * the Synthesis repository holds finished packages to compare with.
 */
import { createExprNode } from '@synthesis/jsx-runtime'
import type { ExprNode } from '@synthesis/jsx-runtime'
import { abstractM2M } from '@synthesis/engine'
import type { ModelStore } from '@synthesis/engine'
import * as rmT from '@synthesis/standard-metamodels/relational/model-legacy'
import { RelSchema, Table, Column } from '@synthesis/standard-metamodels/relational/components-legacy'

export class MyTransformation extends abstractM2M<rmT.IRelSchema, rmT.IRelSchema> {
  constructor(store: ModelStore) {
    super(store)
  }

  template(s: rmT.IRelSchema): ExprNode<rmT.IRelSchema, rmT.IRelSchema> {
    const tables = s.elements
      .filter((el) => this.context.store.isTypeOf(el, rmT.Table))
      .map((el) => {
        const tab = el as rmT.ITable
        return createExprNode(
          Table,
          { name: tab.name },
          ...(tab.columns ?? []).map((c) =>
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
      })
    return createExprNode(
      RelSchema,
      { name: `${s.name}_out`, content: '', MDA_level: 'M1', store: this.context.store },
      ...tables
    )
  }
}
