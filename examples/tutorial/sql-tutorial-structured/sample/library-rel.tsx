/** @jsx createExprNode */

import { createExprNode } from '@aelastics/synthesis/jsx'
import type { ExprNode } from '@aelastics/synthesis/jsx'
import type { ModelStore } from '@aelastics/synthesis/store'
import type { SynthHeaderInput } from '@aelastics/synthesis/envelope'
import { RelSchema, Table, Column } from 'rel-tutorial-metamodel'
import type * as rmT from 'rel-tutorial-metamodel/model'

export const $synth = {
  kind: 'model',
  metamodel: 'rel-tutorial-metamodel',
  author: 'Sinisa Neskovic',
  version: '0.1.0',
  description: 'Sample relational schema for the model-to-text tutorial: the output of eer-tutorial-basic'
} as const satisfies SynthHeaderInput

/**
 * This is literally what the model-to-model tutorial hands over: run
 * eer-tutorial-basic on its sample Library schema and this is the model
 * it writes. The two halves of the tutorial meet here, so the schema is
 * reproduced verbatim rather than rewritten by hand.
 *
 * Element names are unique across the whole model, which is why the
 * foreign key columns carry the qualified names the upstream
 * transformation gave them.
 */
export default (store: ModelStore): ExprNode<rmT.IRelSchema> => (
  <RelSchema name="Library_rel" store={store}>
    <Table name="Book">
      <Column name="bookId" type="INTEGER" isKey={true} isAutoincrement={true} isNullable={false} />
      <Column name="bookTitle" type="VARCHAR(255)" isKey={false} isAutoincrement={false} isNullable={true} />
    </Table>
    <Table name="Author">
      <Column name="authorId" type="INTEGER" isKey={true} isAutoincrement={true} isNullable={false} />
      <Column name="authorName" type="VARCHAR(255)" isKey={false} isAutoincrement={false} isNullable={true} />
    </Table>
    <Table name="Category">
      <Column name="categoryId" type="INTEGER" isKey={true} isAutoincrement={true} isNullable={false} />
      <Column name="categoryName" type="VARCHAR(255)" isKey={false} isAutoincrement={false} isNullable={true} />
    </Table>
    {/* The 1:N relationship writtenBy became a foreign key column grafted
        onto the already declared Book table: $refByName reopens Book and
        adds to it rather than declaring a second table. */}
    <Table $refByName="Book">
      <Column
        name="AuthorId_FK"
        type="INTEGER"
        isKey={false}
        isNullable={true}
        isAutoincrement={false}
        references={<Column $refByName="authorId" />}
      />
    </Table>
    {/* The M:N relationship categorizedAs became a join table of two
        foreign keys. */}
    <Table name="categorizedAs">
      <Column
        name="BookId_FK"
        type="INTEGER"
        isKey={false}
        isNullable={false}
        isAutoincrement={false}
        references={<Column $refByName="bookId" />}
      />
      <Column
        name="CategoryId_FK"
        type="INTEGER"
        isKey={false}
        isNullable={false}
        isAutoincrement={false}
        references={<Column $refByName="categoryId" />}
      />
    </Table>
  </RelSchema>
)
