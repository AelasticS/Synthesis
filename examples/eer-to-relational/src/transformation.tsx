/** @jsx createExprNode */

/**
 * Configuration-based EER to relational transformation, the flagship Synthesis
 * example. Three design issues are left open by the transformation and
 * closed per run by a configuration model: how 1:N relationships are
 * implemented (foreign key or join table), how primary keys are generated
 * (auto increment or manual), and how identifiers are named (camelCase or
 * snake_case). Each issue appears here as a @VarPoint method whose
 * @VarOption implementations correspond to options declared in the
 * decision model (see decision-model.tsx).
 */
import { createExprNode } from "@synthesis/jsx-runtime"
import { VarPoint, VarOption, Default, Option, DecisionAwareM2M } from "@synthesis/decision-framework"
import {
  IEntity,
  IEERSchema,
  IAttribute,
  IRelationship,
  IOrdinaryMapping,
  Relationship,
  Entity,
  IDomain,
} from "@synthesis/standard-metamodels/eer/model"
import * as rmT from "@synthesis/standard-metamodels/relational/model-legacy"
import { ExprNode } from "@synthesis/jsx-runtime"
import { E2E, ModelStore, M2M } from "@synthesis/engine"
import * as cm from "@synthesis/decision-framework/decisions/3.configuration-model/configuration-meta.model"
import { RelSchema, Table, Column } from "@synthesis/standard-metamodels/relational/components-legacy"

@M2M()
export class EER2RelDomainWithDecisionTransformation extends DecisionAwareM2M<
  IEERSchema,
  rmT.IRelSchema,
  {},
  cm.IConfigurationModel
> {
  constructor(store: ModelStore, {}, configModel?: cm.IConfigurationModel) {
    super(store, {}, configModel)
  }

  template(s: IEERSchema) {
    return (
      <RelSchema name={`${s.name}_Relational_Schema_with_Decision_Model`} content="" MDA_level="M1" store={this.context.store}>
        {s.elements
          .filter((el) => this.context.store.isTypeOf(el, Entity))
          .map((el) => this.Entity2Table(el as IEntity))}

        {s.elements
          .filter((el) => this.context.store.isTypeOf(el, Relationship))
          .map((r) => this.RelationshipMapping(r as IRelationship))}
      </RelSchema>
    )
  }

  @E2E()
  Entity2Table(e: IEntity): ExprNode<rmT.ITable> {
    return <Table name={this.applyNaming(e.name)}>{e.attributes.map((a) => this.Attribute2Column(a))}</Table>
  }

  @E2E()
  Attribute2Column(a: IAttribute): ExprNode<rmT.IColumn> {
    return <Column name={this.applyNaming(a.name)} isKey={a.isKey} isAutoincrement={this.primaryKeyStrategy(a)} type={this.getColumnType(a.attrDomain)}></Column>
  }

  // @E2E is outermost: wraps the VarPoint dispatcher, so tracing happens after VarPoint selects
  // and calls the matching VarOption method. @VarPoint must be inner (applied first) so it
  // registers its options bucket in the registry before @VarOption decorators run on later methods.
  @E2E()
  @VarPoint("OneToManyStrategy")
  RelationshipMapping(rel: IRelationship): ExprNode<rmT.IColumn> | ExprNode<rmT.ITable> {
    throw new Error("Not implemented VarOptions for VarPoint RelationshipMapping")
  }

  // Element names are unique across the whole model, not per table, so
  // foreign key columns are qualified with the relationship name. Without
  // that, two relationships referencing the same entity would produce the
  // same column name and the render would fail on a duplicate.
  @Default()
  @VarOption("RelationshipMapping", Option("ForeignKey"))
  relationshipAsForeignKey(rel: IRelationship): ExprNode<rmT.IColumn> {
    const fkSide = this.getFKSide(rel)
    const pkSide = this.getPKSide(rel)

    return (
      <Table $refByName={this.applyNaming(pkSide.domain.name)}>
        <Column
          name={this.applyNaming(rel.name + "_" + fkSide.domain.name + "Id_FK")}
          type={this.keyColumnType(fkSide.domain)}
          isForeignKey={true}
          isKey={false}
          references={this.applyNaming(fkSide.domain.name)}
          isNullable={fkSide.lb === "0"}
        />
      </Table>
    )
  }

  @VarOption("RelationshipMapping", Option("JoinTable"))
  relationshipAsJoinTable(rel: IRelationship): ExprNode<rmT.ITable> {
    const role1 = rel.roles[0]
    const role2 = rel.roles[1]

    return (
      <Table name={this.applyNaming(rel.name)}>
        <Column
          name={this.applyNaming(rel.name + "_" + role1.domain.name + "Id_FK")}
          type={this.keyColumnType(role1.domain)}
          isForeignKey={true}
          references={this.applyNaming(role1.domain.name)}
          isNullable={role1.lb !== "1" && role1.ub !== "1"}
          isKey={role1.ub === "1"}
        />
        <Column
          name={this.applyNaming(rel.name + "_" + role2.domain.name + "Id_FK")}
          type={this.keyColumnType(role2.domain)}
          isForeignKey={true}
          references={this.applyNaming(role2.domain.name)}
          isNullable={role2.lb !== "1"}
          isKey={role2.ub === "1"}
        />
      </Table>
    )
  }

  // ######### START PrimaryKeyStrategy variations #############

  @VarPoint("PrimaryKeyStrategy")
  primaryKeyStrategy(a: IAttribute): boolean {
    throw new Error("Not implemented VarOptions for VarPoint PrimaryKeyStrategy")
  }

  @VarOption("primaryKeyStrategy", Option("UseAutoIncrement"))
  useAutoIncrement(a: IAttribute): boolean {
    return a.isKey ? true : false
  }

  @VarOption("primaryKeyStrategy", Option("UseManualIncrement"))
  useManualIncrement(a: IAttribute): boolean {
    return false
  }

  // ######### END PrimaryKeyStrategy variations #############

  // ######### START NamingConvention variations #############

  @VarPoint("NamingConvention")
  applyNaming(name: string): string {
    throw new Error("Not implemented VarOptions for VarPoint NamingConvention")
  }

  @VarOption("applyNaming", Option("CamelCase"))
  applyCamelCaseNaming(name: string): string {
    return name.replace(/_/g, "")
  }

  @VarOption("applyNaming", Option("SnakeCase"))
  applySnakeCaseNaming(name: string): string {
    return name
      .replace(/([a-z])([A-Z])/g, "$1_$2")
      .replace(/([A-Z]+)([A-Z][a-z])/g, "$1_$2")
      .toLowerCase()
  }

  // ######### END NamingConvention variations #############

  private getFKSide(rel: IRelationship): IOrdinaryMapping {
    // The side with upper bound 1 carries the foreign key
    return rel.roles.find((m) => m.ub === "1") || rel.roles[0]
  }

  private getPKSide(rel: IRelationship): IOrdinaryMapping {
    // The side with upper bound N receives the foreign key column
    return rel.roles.find((m) => m.ub !== "1") || rel.roles[1]
  }

  private keyColumnType(entity: IEntity): string {
    // A foreign key column has the type of the referenced entity's key attribute
    const key = entity.attributes.find((a) => a.isKey)
    return key ? this.getColumnType(key.attrDomain) : "VARCHAR(255)"
  }

  private getColumnType(domain: IDomain): string {
    // Map EER domain types to relational column types
    const domainName = domain.name.toLowerCase()

    switch (domainName) {
      case "string":
        return "VARCHAR(255)"
      case "number":
      case "integer":
      case "int":
        return "INTEGER"
      case "float":
      case "double":
        return "DOUBLE"
      case "boolean":
      case "bool":
        return "BOOLEAN"
      case "date":
        return "DATE"
      case "datetime":
      case "timestamp":
        return "TIMESTAMP"
      case "text":
        return "TEXT"
      case "bigint":
        return "BIGINT"
      default:
        return "VARCHAR(255)"
    }
  }
}
