/** @jsx createExprNode */

/**
 * Tutorial Part 4: Part 1's fixed-logic transformation moved onto the
 * name-scopes metamodel stages. The rule structure is untouched;
 * what changes is the naming world. Entities and tables scope their
 * members' names, so attributes and columns carry natural names such as
 * `id`, a foreign key column takes the referenced entity's name as its
 * prefix (`authorId`), and a reference into another table's scope is a
 * path such as `Author/id`.
 */
import { createExprNode } from '@aelastics/synthesis/jsx'
import type { ExprNode } from '@aelastics/synthesis/jsx'
import { abstractM2M } from '@aelastics/synthesis/m2m'
import type { ModelStore } from '@aelastics/synthesis/store'
import * as em from 'eer-tutorial-metamodel/name-scopes/model'
import * as rmT from 'rel-tutorial-metamodel/name-scopes/model'
import { RelSchema, Table, Column } from 'rel-tutorial-metamodel/name-scopes'

export class EER2RelNameScopesTransformation extends abstractM2M<em.IEERSchema, rmT.IRelSchema> {
  constructor(store: ModelStore) {
    super(store)
  }

  template(s: em.IEERSchema): ExprNode<em.IEERSchema, rmT.IRelSchema> {
    return (
      <RelSchema name={`${s.name}_rel`} store={this.context.store}>
        {s.elements
          .filter((el) => this.context.store.isTypeOf(el, em.Entity))
          .map((el) => this.entityToTable(el as em.IEntity))}
        {s.elements
          .filter((el) => this.context.store.isTypeOf(el, em.Relationship))
          .map((el) => this.relationshipToStructure(el as em.IRelationship))}
      </RelSchema>
    )
  }

  entityToTable(e: em.IEntity): ExprNode<rmT.ITable> {
    return (
      <Table name={e.name}>
        {e.attributes.map((a) => this.attributeToColumn(a))}
      </Table>
    )
  }

  // Because the table scopes its columns, the attribute's natural name
  // is carried over as is: every table can have its own `id`.
  attributeToColumn(a: em.IAttribute): ExprNode<rmT.IColumn> {
    return (
      <Column
        name={a.name}
        type={this.columnType(a.attrDomain)}
        isKey={a.isKey}
        isAutoincrement={a.isKey}
        isNullable={!a.isKey}
      />
    )
  }

  // The fixed relationship logic of Part 1, unchanged: one conditional
  // decides the mapping. M:N becomes a join table, everything else a
  // foreign key on the N side.
  relationshipToStructure(rel: em.IRelationship): ExprNode<rmT.ITable> {
    const [role1, role2] = rel.roles
    if (role1.ub === 'M' && role2.ub === 'M') {
      return this.relationshipAsJoinTable(rel)
    }
    return this.relationshipAsForeignKey(rel)
  }

  relationshipAsForeignKey(rel: em.IRelationship): ExprNode<rmT.ITable> {
    const fkSide = rel.roles.find((r) => r.ub === '1') ?? rel.roles[0]
    const pkSide = rel.roles.find((r) => r !== fkSide) ?? rel.roles[1]
    const key = this.keyAttributeOf(fkSide.domain)

    return (
      <Table $refByName={pkSide.domain.name}>
        <Column
          name={this.foreignKeyName(fkSide.domain)}
          type={this.columnType(key.attrDomain)}
          isKey={false}
          isNullable={fkSide.lb === '0'}
          isAutoincrement={false}
          references={<Column $refByName={`${fkSide.domain.name}/${key.name}`} />}
        />
      </Table>
    )
  }

  relationshipAsJoinTable(rel: em.IRelationship): ExprNode<rmT.ITable> {
    return (
      <Table name={rel.name}>
        {rel.roles.map((role) => (
          <Column
            name={this.foreignKeyName(role.domain)}
            type={this.columnType(this.keyAttributeOf(role.domain).attrDomain)}
            isKey={false}
            isNullable={false}
            isAutoincrement={false}
            references={<Column $refByName={`${role.domain.name}/${this.keyAttributeOf(role.domain).name}`} />}
          />
        ))}
      </Table>
    )
  }

  // The scoped foreign key naming convention: the referenced entity's
  // name, lowercased at its head, prefixes its key attribute's name
  // (`Author` and `id` give `authorId`), so the column name says what
  // it points at and is unique inside its table by construction.
  private foreignKeyName(entity: em.IEntity): string {
    const key = this.keyAttributeOf(entity)
    const head = entity.name.charAt(0).toLowerCase() + entity.name.slice(1)
    const tail = key.name.charAt(0).toUpperCase() + key.name.slice(1)
    return `${head}${tail}`
  }

  // Domains carry the type information: a column's SQL type is derived
  // from the attribute's domain.
  private columnType(domain: em.IDomain): string {
    switch (domain.name.toLowerCase()) {
      case 'number':
        return 'INTEGER'
      case 'string':
        return 'VARCHAR(255)'
      case 'boolean':
        return 'BOOLEAN'
      default:
        return 'VARCHAR(255)'
    }
  }

  // A foreign key points at the primary key column of the entity it
  // references, so that column has to exist: an entity without a key
  // attribute cannot be referenced at all.
  private keyAttributeOf(entity: em.IEntity): em.IAttribute {
    const key = entity.attributes.find((a) => a.isKey)
    if (!key) {
      throw new Error(`Entity '${entity.name}' has no key attribute, so nothing can reference it`)
    }
    return key
  }
}
