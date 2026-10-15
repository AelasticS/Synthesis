/** @jsx createExprNode */

/**
 * Starter transformation: copies a schema of the tutorial relational
 * metamodel (rel-tutorial-metamodel) unchanged. It builds, installs,
 * and runs as-is, so you always have a working baseline; make it yours
 * step by step:
 *
 * 1. Rename the class, and keep synth.json's exportName in sync.
 * 2. Point synth.json's source and target at your metamodels, and
 *    replace the imports below accordingly.
 * 3. Implement template(): map the source model onto the target model
 *    in JSX notation, using the target metamodel's components as tags.
 *
 * The tutorial walks through every step, and the examples/ catalog in
 * the Synthesis repository holds finished packages to compare with.
 */
import { createExprNode } from '@aelastics/synthesis/jsx'
import type { ExprNode } from '@aelastics/synthesis/jsx'
import { abstractM2M } from '@aelastics/synthesis/m2m'
import type { ModelStore } from '@aelastics/synthesis/store'
import * as rmT from 'rel-tutorial-metamodel/model'
import { RelSchema, Table, Column } from 'rel-tutorial-metamodel'

export class MyTransformation extends abstractM2M<rmT.IRelSchema, rmT.IRelSchema> {
  constructor(store: ModelStore) {
    super(store)
  }

  main(s: rmT.IRelSchema): ExprNode<rmT.IRelSchema, rmT.IRelSchema> {
    return (
      <RelSchema name={`${s.name}_out`} store={this.context.store}>
        {s.elements
          .filter((el) => this.context.store.isTypeOf(el, rmT.Table))
          .map((el) => this.copyTable(el as rmT.ITable))}
      </RelSchema>
    )
  }

  // A foreign key is a column whose `references` link points at the
  // primary key column it refers to; there is no isForeignKey flag.
  // The link is re-established in the copy by name, which works because
  // element names are unique across the whole model.
  copyTable(tab: rmT.ITable): ExprNode<rmT.ITable> {
    return (
      <Table name={tab.name}>
        {(tab.columns ?? []).map((c) => (
          <Column
            name={c.name}
            type={c.type}
            isKey={c.isKey}
            isAutoincrement={c.isAutoincrement}
            isNullable={c.isNullable}
            {...(c.references ? { references: <Column $refByName={c.references.name} /> } : {})}
          />
        ))}
      </Table>
    )
  }
}
