/** @jsx createExprNode */
/*
 * Copyright (c) AelasticS 2022.
 */
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { createExprNode } from "@aelastics/synthesis/jsx";
import { E2E, M2M, abstractM2M } from "@aelastics/synthesis/m2m";
import { Relationship, Entity, } from "simple-eer-metamodel/model";
import { RelSchema, Table, Column } from "simple-relational-metamodel";
let SimpleEerToRelational = class SimpleEerToRelational extends abstractM2M {
    constructor(store) {
        super(store);
    }
    main(s) {
        return (createExprNode(RelSchema, { name: `${s.name}_Relational_Schema`, store: this.context.store },
            s.elements
                .filter((el) => this.context.store.isTypeOf(el, Entity))
                .map((el) => this.Entity2Table(el)),
            s.elements
                .filter((el) => this.context.store.isTypeOf(el, Relationship))
                .map((r) => this.RelationshipMapping(r))));
    }
    Entity2Table(e) {
        return createExprNode(Table, { name: this.applyNaming(e.name) }, e.attributes.map((a) => this.Attribute2Column(a)));
    }
    Attribute2Column(a) {
        return createExprNode(Column, { name: this.applyNaming(a.name), isKey: a.isKey, isAutoincrement: a.isKey, type: this.getColumnType(a.attrDomain) });
    }
    // Every relationship becomes a foreign key column in the table on the
    // side with upper bound 1; there is no join-table alternative here.
    RelationshipMapping(rel) {
        const fkSide = this.getFKSide(rel);
        const pkSide = this.getPKSide(rel);
        return (createExprNode(Table, { "$refByName": this.applyNaming(fkSide.domain.name) },
            createExprNode(Column, { name: this.applyNaming(pkSide.domain.name + "Id_FK"), type: this.getColumnType(pkSide.domain), isForeignKey: true, isKey: false, references: pkSide.domain.name, isNullable: fkSide.lb === "0" })));
    }
    // Fixed camelCase naming: underscores are dropped.
    applyNaming(name) {
        return name.replace(/_/g, "");
    }
    getFKSide(rel) {
        // Return the side with upperBound = 1 (many-to-one side becomes FK side)
        return rel.roles.find((m) => m.ub === "1") || rel.roles[0];
    }
    getPKSide(rel) {
        // Return the side with upperBound = N (one-to-many side becomes PK side)
        return rel.roles.find((m) => m.ub !== "1") || rel.roles[1];
    }
    getColumnType(domain) {
        // Map EER domain types to relational column types
        const domainName = (domain?.name ?? "").toLowerCase();
        switch (domainName) {
            case "string":
                return "VARCHAR(255)";
            case "number":
            case "integer":
            case "int":
                return "INTEGER";
            case "float":
            case "double":
                return "DOUBLE";
            case "boolean":
            case "bool":
                return "BOOLEAN";
            case "date":
                return "DATE";
            case "datetime":
            case "timestamp":
                return "TIMESTAMP";
            case "text":
                return "TEXT";
            case "bigint":
                return "BIGINT";
            default:
                return "VARCHAR(255)"; // Default fallback
        }
    }
};
__decorate([
    E2E()
], SimpleEerToRelational.prototype, "Entity2Table", null);
__decorate([
    E2E()
], SimpleEerToRelational.prototype, "Attribute2Column", null);
__decorate([
    E2E()
], SimpleEerToRelational.prototype, "RelationshipMapping", null);
SimpleEerToRelational = __decorate([
    M2M()
], SimpleEerToRelational);
export { SimpleEerToRelational };
//# sourceMappingURL=transformation.js.map