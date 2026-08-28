/** @jsx createExprNode */

/**
 * Endogenous relational -> relational copy transformation, the minimal
 * Synthesis m2m example. Source and target metamodels are identical, so
 * everything on display is the mechanics: a transformation class whose
 * template() maps the source model onto the target model in JSX
 * notation, using the target metamodel's components as tags.
 */
import { createExprNode } from '@synthesis/jsx-runtime'
import type { ExprNode } from '@synthesis/jsx-runtime'
import { abstractM2M } from '@synthesis/engine'
import type { ModelStore } from '@synthesis/engine'
import * as rmT from '@synthesis/standard-metamodels/relational/model-legacy'
import { RelSchema, Table, Column } from '@synthesis/standard-metamodels/relational/components-legacy'

export class RelCopyTransformation extends abstractM2M<rmT.IRelSchema, rmT.IRelSchema> {
  constructor(store: ModelStore) {
    super(store)
  }

  template(s: rmT.IRelSchema): ExprNode<rmT.IRelSchema, rmT.IRelSchema> {
    return (
      <RelSchema name={`${s.name}_copy`} content="" MDA_level="M1" store={this.context.store}>
        {s.elements
          .filter((el) => this.context.store.isTypeOf(el, rmT.Table))
          .map((el) => this.copyTable(el as rmT.ITable))}
      </RelSchema>
    )
  }

  copyTable(tab: rmT.ITable): ExprNode<rmT.ITable> {
    return (
      <Table name={tab.name}>
        {(tab.columns ?? []).map((c) => (
          <Column
            name={c.name}
            type={c.type}
            isKey={c.isKey}
            isAutoincrement={c.isAutoincrement}
            isForeignKey={c.isForeignKey}
            isNullable={c.isNullable}
            {...(c.references ? { references: c.references } : {})}
          />
        ))}
      </Table>
    )
  }
}
