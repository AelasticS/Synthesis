/** @jsx createExprNode */

/**
 * Tutorial Part 2: the Part 1 transformation with its entity rule opened
 * up as a specialization point. The source metamodel now distinguishes
 * Kernel from Weak entities, and the two need different tables, so
 * `entityToTable` keeps only what every table shares and the
 * `@SpecOption` rules add what a subtype needs on top of it. The
 * relationship logic is still the plain conditional of Part 1; Part 3
 * turns that one into a configuration-based rule.
 */
import { createExprNode } from '@synthesis/jsx-runtime'
import type { ExprNode } from '@synthesis/jsx-runtime'
import { abstractM2M, E2E, SpecPoint, SpecOption } from '@synthesis/engine'
import type { ModelStore } from '@synthesis/engine'
import * as em from '@synthesis/standard-metamodels/eer-tutorial/advanced/model'
import * as rmT from '@synthesis/standard-metamodels/relational/model-legacy'
import { RelSchema, Table, Column } from '@synthesis/standard-metamodels/relational/components-legacy'

export class EER2RelAdvancedTransformation extends abstractM2M<em.IEERSchema, rmT.IRelSchema> {
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

  // The specialization point: the table skeleton every entity produces,
  // a name plus one column per attribute. The engine calls it for any
  // entity, then merges the result with the option selected for the
  // entity's runtime type. @E2E stays outermost so it traces the merged
  // result.
  @E2E()
  @SpecPoint()
  entityToTable(e: em.IEntity): ExprNode<rmT.ITable> {
    return (
      <Table name={e.name}>
        {e.attributes.map((a) => this.attributeToColumn(a))}
      </Table>
    )
  }

  // A kernel entity is independent: its own key attribute identifies it,
  // so the skeleton is already the whole table and this option adds
  // nothing. It still has to exist, because dispatch is total: an entity
  // with no matching option is an error, not a fall back to the base
  // rule.
  @SpecOption('entityToTable', em.Kernel)
  kernelToTable(k: em.IKernel): ExprNode<rmT.ITable> {
    return <Table />
  }

  // A weak entity is identified relative to its owner, so its table adds
  // a foreign key to the owner's key, and that column takes part in the
  // primary key next to the entity's own partial key. Name and attribute
  // columns come from the skeleton.
  @SpecOption('entityToTable', em.Weak)
  weakToTable(w: em.IWeak): ExprNode<rmT.ITable> {
    return (
      <Table>
        <Column
          name={`${w.name}_${w.owner.name}Id_FK`}
          type={this.keyColumnType(w.owner)}
          isKey={true}
          isForeignKey={true}
          references={w.owner.name}
          isNullable={false}
          isAutoincrement={false}
        />
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
        isForeignKey={false}
        isNullable={!a.isKey}
      />
    )
  }

  // Unchanged from Part 1: one conditional still decides the mapping.
  // Relationship variants are a design choice, not a subtype of the
  // source element, so specialization cannot express them. Part 3 turns
  // this into a configuration-based rule.
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
          type={this.keyColumnType(fkSide.domain)}
          isForeignKey={true}
          isKey={false}
          references={fkSide.domain.name}
          isNullable={fkSide.lb === '0'}
          isAutoincrement={false}
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
            type={this.keyColumnType(role.domain)}
            isForeignKey={true}
            isKey={false}
            references={role.domain.name}
            isNullable={false}
            isAutoincrement={false}
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

  // A foreign key column has the type of the referenced entity's key
  // attribute.
  private keyColumnType(entity: em.IEntity): string {
    const key = entity.attributes.find((a) => a.isKey)
    return key ? this.columnType(key.attrDomain) : 'VARCHAR(255)'
  }
}
