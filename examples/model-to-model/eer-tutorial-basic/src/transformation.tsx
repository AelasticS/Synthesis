/** @jsx createExprNode */

/**
 * Tutorial Part 1: a simple EER to relational transformation with fixed
 * logic and no decorators. Entities become tables, attributes become
 * columns typed by their domains, and relationships are mapped by one
 * plain conditional: M:N becomes a join table, everything else becomes
 * a foreign key on the N side. Later tutorial parts dissolve exactly
 * this conditional into specialized and configuration-based rules.
 */
import { createExprNode } from '@synthesis/jsx-runtime'
import type { ExprNode } from '@synthesis/jsx-runtime'
import { abstractM2M } from '@synthesis/engine'
import type { ModelStore } from '@synthesis/engine'
import * as em from '@synthesis/standard-metamodels/eer-tutorial/basic/model'
import * as rmT from '@synthesis/standard-metamodels/rel-tutorial/model'
import { RelSchema, Table, Column } from '@synthesis/standard-metamodels/rel-tutorial/components'

export class EER2RelBasicTransformation extends abstractM2M<em.IEERSchema, rmT.IRelSchema> {
  constructor(store: ModelStore) {
    super(store)
  }

  template(s: em.IEERSchema): ExprNode<em.IEERSchema, rmT.IRelSchema> {
    return (
      <RelSchema name={`${s.name}_rel`} content="" MDA_level="M1" store={this.context.store}>
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

  // The fixed relationship logic of Part 1: one conditional decides the
  // mapping. Part 2 turns rule variants into type-dispatched
  // specializations, and Part 3 turns the genuinely open case into a
  // configuration-based rule.
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

    return (
      <Table $refByName={pkSide.domain.name}>
        <Column
          name={`${fkSide.domain.name}Id_FK`}
          type={this.columnType(this.keyAttributeOf(fkSide.domain).attrDomain)}
          isKey={false}
          isNullable={fkSide.lb === '0'}
          isAutoincrement={false}
          references={<Column $refByName={this.keyAttributeOf(fkSide.domain).name} />}
        />
      </Table>
    )
  }

  relationshipAsJoinTable(rel: em.IRelationship): ExprNode<rmT.ITable> {
    return (
      <Table name={rel.name}>
        {rel.roles.map((role) => (
          <Column
            name={`${role.domain.name}Id_FK`}
            type={this.columnType(this.keyAttributeOf(role.domain).attrDomain)}
            isKey={false}
            isNullable={false}
            isAutoincrement={false}
            references={<Column $refByName={this.keyAttributeOf(role.domain).name} />}
          />
        ))}
      </Table>
    )
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
