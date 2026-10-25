/** @jsx createExprNode */
/*
 * Copyright (c) AelasticS 2022.
 */

import { createExprNode, ExprNode } from "@aelastics/synthesis/jsx"
import { E2E, M2M, abstractM2M } from "@aelastics/synthesis/m2m"
import { ModelStore } from "@aelastics/synthesis/store"
import {
  IEntity,
  IEERSchema,
  IAttribute,
  IRelationship,
  IOrdinaryMapping,
  Relationship,
  Entity,
  IDomain,
} from "simple-eer-metamodel/model"
import * as rmT from "simple-relational-metamodel/model"
import { RelSchema, Table, Column } from "simple-relational-metamodel"

@M2M()
export class SimpleEerToRelational extends abstractM2M<IEERSchema, rmT.IRelSchema> {
  constructor(store: ModelStore) {
    super(store)
  }

  main(s: IEERSchema) {
    return (
        <RelSchema name={`${s.name}_Relational_Schema`} store={this.context.store}>
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
    return <Column name={this.applyNaming(a.name)} isKey={a.isKey} isAutoincrement={a.isKey} type={this.getColumnType(a.attrDomain)}></Column>
  }

  // Every relationship becomes a foreign key column in the table on the
  // side with upper bound 1; there is no join-table alternative here.
  @E2E()
  RelationshipMapping(rel: IRelationship): ExprNode<rmT.ITable> {
    const fkSide = this.getFKSide(rel)
    const pkSide = this.getPKSide(rel)

    return (
        <Table $refByName={this.applyNaming(fkSide.domain.name)}>
          <Column
              name={this.applyNaming(pkSide.domain.name + "Id_FK")}
              type={this.getColumnType(pkSide.domain)}
              isForeignKey={true}
              isKey={false}
              references={pkSide.domain.name}
              isNullable={fkSide.lb === "0"}
          />
        </Table>
    )
  }

  // Fixed camelCase naming: underscores are dropped.
  private applyNaming(name: string): string {
    return name.replace(/_/g, "")
  }

  private getFKSide(rel: IRelationship): IOrdinaryMapping {
    // Return the side with upperBound = 1 (many-to-one side becomes FK side)
    return rel.roles.find((m) => m.ub === "1") || rel.roles[0]
  }

  private getPKSide(rel: IRelationship): IOrdinaryMapping {
    // Return the side with upperBound = N (one-to-many side becomes PK side)
    return rel.roles.find((m) => m.ub !== "1") || rel.roles[1]
  }

  private getColumnType(domain: IDomain | undefined): string {
    // Map EER domain types to relational column types
    const domainName = (domain?.name ?? "").toLowerCase()

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
        return "VARCHAR(255)" // Default fallback
    }
  }
}
