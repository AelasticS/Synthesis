/** @jsx createExprNode */

/**
 * Tutorial Part 3: the Part 2 transformation with its relationship
 * mapping opened up as a variation point. The entity rule is unchanged,
 * still a specialization point dispatching on Kernel and Weak. What
 * changes is the relationship side: an M:N relationship has no choice,
 * a join table is the only structure that can hold it, so that branch
 * stays plain code. A 1:N relationship can legitimately be either a
 * foreign key on the N side or a join table, and nothing in the source
 * model settles it. That question is left open here and closed per run
 * by a configuration model (see decision-model.tsx and
 * binding-model.tsx).
 */
import { createExprNode } from '@aelastics/synthesis/jsx'
import type { ExprNode } from '@aelastics/synthesis/jsx'
import { E2E, SpecPoint, SpecOption, M2M } from '@aelastics/synthesis/m2m'
import type { ModelStore } from '@aelastics/synthesis/store'
import { DecisionAwareM2M, VarPoint, VarOption, Default, Option } from '@aelastics/synthesis/variability'
import * as cm from '@aelastics/synthesis/metamodels/configuration/model'
import * as em from '@synthesis/standard-metamodels/eer-tutorial/advanced/model'
import * as rmT from '@synthesis/standard-metamodels/rel-tutorial/model'
import { RelSchema, Table, Column } from '@synthesis/standard-metamodels/rel-tutorial/components'

@M2M()
export class EER2RelConfigurableTransformation extends DecisionAwareM2M<
  em.IEERSchema,
  rmT.IRelSchema,
  {},
  cm.IConfigurationModel
> {
  // A configuration-based transformation takes the run's configuration
  // model as a third argument. It is optional: without one, every
  // variation point falls back to its @Default option.
  constructor(store: ModelStore, {}, configModel?: cm.IConfigurationModel) {
    super(store, {}, configModel)
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

  // Unchanged from Part 2: the specialization point, the table skeleton
  // every entity produces. @E2E stays outermost so it traces the merged
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

  // A kernel entity is independent, so the skeleton is already the whole
  // table. The option still has to exist: dispatch is total.
  @SpecOption('entityToTable', em.Kernel)
  kernelToTable(k: em.IKernel): ExprNode<rmT.ITable> {
    return <Table />
  }

  // A weak entity is identified relative to its owner, so its table adds
  // a foreign key to the owner's key, and that column takes part in the
  // primary key next to the entity's own partial key.
  @SpecOption('entityToTable', em.Weak)
  weakToTable(w: em.IWeak): ExprNode<rmT.ITable> {
    return (
      <Table>
        <Column
          name={`${w.name}_${w.owner.name}Id_FK`}
          type={this.columnType(this.keyAttributeOf(w.owner).attrDomain)}
          isKey={true}
          isNullable={false}
          isAutoincrement={false}
          references={<Column $refByName={this.keyAttributeOf(w.owner).name} />}
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
        isNullable={!a.isKey}
      />
    )
  }

  // The line between fixed logic and an open decision. An M:N
  // relationship cannot be carried by a foreign key column on either
  // side, so the join table is structurally forced and the branch stays
  // plain code. Everything else reaching this rule is 1:N, and there the
  // structure is a design choice, so the rule hands over to a variation
  // point.
  relationshipToStructure(rel: em.IRelationship): ExprNode<rmT.ITable> {
    const [role1, role2] = rel.roles
    if (role1.ub === 'M' && role2.ub === 'M') {
      return this.relationshipAsJoinTable(rel)
    }
    return this.oneToManyMapping(rel)
  }

  // The variation point. Its body is never executed: the engine looks up
  // the option selected for this relationship in the run's configuration
  // model and calls that method instead. @E2E is outermost so the trace
  // records which option was taken; @VarPoint must be inner so it
  // registers its options bucket before the @VarOption decorators run.
  @E2E()
  @VarPoint('OneToManyStrategy')
  oneToManyMapping(rel: em.IRelationship): ExprNode<rmT.ITable> {
    throw new Error('No option selected for the OneToManyStrategy variation point')
  }

  // The default option, matching isDefault on ForeignKey in the decision
  // model: the N side gains a foreign key column pointing at the 1 side.
  @Default()
  @VarOption('oneToManyMapping', Option('ForeignKey'))
  oneToManyAsForeignKey(rel: em.IRelationship): ExprNode<rmT.ITable> {
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

  // The alternative option: the same join table an M:N relationship gets.
  // A 1:N relationship in a table of its own costs a join on every read
  // but keeps the N side free of the reference, which is what makes this
  // a design decision rather than a derivable fact.
  @VarOption('oneToManyMapping', Option('JoinTable'))
  oneToManyAsJoinTable(rel: em.IRelationship): ExprNode<rmT.ITable> {
    return this.relationshipAsJoinTable(rel)
  }

  // Fixed logic, shared by the M:N branch and the JoinTable option.
  // Column names are qualified by the relationship, the way the weak
  // entity rule qualifies its owner key with the entity name. Once 1:N
  // relationships may become join tables too, one schema can hold two
  // join tables that both reference Book, and column names are unique
  // per schema.
  relationshipAsJoinTable(rel: em.IRelationship): ExprNode<rmT.ITable> {
    return (
      <Table name={rel.name}>
        {rel.roles.map((role) => (
          <Column
            name={`${rel.name}_${role.domain.name}Id_FK`}
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
