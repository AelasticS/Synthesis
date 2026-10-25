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
import { VarPoint, VarOption, Default, Option, DecisionAwareM2M } from "@aelastics/synthesis/variability";
import { E2E, M2M } from "@aelastics/synthesis/m2m";
import { Relationship, Entity, } from "simple-eer-metamodel/model";
import { RelSchema, Table, Column } from "simple-relational-metamodel";
let SimpleEerToRelational = class SimpleEerToRelational extends DecisionAwareM2M {
    constructor(store, {}, configModel) {
        super(store, {}, configModel);
    }
    main(s) {
        return (createExprNode(RelSchema, { name: `${s.name}_Relational_Schema_with_Decision_Model`, store: this.context.store },
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
        return createExprNode(Column, { name: this.applyNaming(a.name), isKey: a.isKey, isAutoincrement: a.isKey ? this.primaryKeyStrategy(a) : false, type: this.getColumnType(a.attrDomain) });
    }
    // @E2E is outermost: wraps the VarPoint dispatcher, so tracing happens after VarPoint selects
    // and calls the matching VarOption method. @VarPoint must be inner (applied first) so it
    // registers its options bucket in the registry before @VarOption decorators run on later methods.
    RelationshipMapping(rel) {
        throw new Error("Not implemented VarOptions for VarPoint RelationshipMapping");
        // return null as unknown as ExprNode<IForeignKey> | ExprNode<ITable>;
    }
    relationshipAsForeignKey(rel) {
        const fkSide = this.getFKSide(rel);
        const pkSide = this.getPKSide(rel);
        return (createExprNode(Table, { "$refByName": this.applyNaming(pkSide.domain.name) },
            createExprNode(Column, { name: this.applyNaming(fkSide.domain.name + "Id_FK"), type: this.getColumnType(fkSide.domain), isForeignKey: true, isKey: false, references: fkSide.domain.name, isNullable: fkSide.lb === "0" })));
    }
    relationshipAsJoinTable(rel) {
        const role1 = rel.roles[0];
        const role2 = rel.roles[1];
        return (createExprNode(Table, { name: this.applyNaming(rel.name) },
            createExprNode(Column, { name: this.applyNaming(role1.domain.name + "Id_FK"), type: this.getColumnType(role1.domain), isForeignKey: true, references: role1.domain.name, isNullable: false, isKey: role1.ub === "1" }),
            createExprNode(Column, { name: this.applyNaming(role2.domain.name + "Id_FK"), type: this.getColumnType(role2.domain), isForeignKey: true, references: role2.domain.name, isNullable: false, isKey: role2.ub === "1" })));
    }
    // ######### START PrimaryKeyStrategy variations #############
    primaryKeyStrategy(a) {
        throw new Error("Not implemented VarOptions for VarPoint PrimaryKeyStrategy");
    }
    useAutoIncrement(a) {
        return a.isKey;
    }
    useManualIncrement(a) {
        return false;
    }
    // ######### END PrimaryKeyStrategy variations #############
    // ######### START NamingConvention variations #############
    applyNaming(name) {
        throw new Error("Not implemented VarOptions for VarPoint NamingConvention");
    }
    applyCamelCaseNaming(name) {
        return name.replace(/_/g, "");
    }
    applySnakeCaseNaming(name) {
        return name
            .replace(/([a-z])([A-Z])/g, "$1_$2")
            .replace(/([A-Z]+)([A-Z][a-z])/g, "$1_$2")
            .toLowerCase();
    }
    // ######### END NamingConvention variations #############
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
    E2E(),
    VarPoint("OneToManyStrategy")
], SimpleEerToRelational.prototype, "RelationshipMapping", null);
__decorate([
    Default(),
    VarOption("RelationshipMapping", Option("ForeignKey"))
], SimpleEerToRelational.prototype, "relationshipAsForeignKey", null);
__decorate([
    VarOption("RelationshipMapping", Option("JoinTable"))
], SimpleEerToRelational.prototype, "relationshipAsJoinTable", null);
__decorate([
    VarPoint("PrimaryKeyStrategy")
], SimpleEerToRelational.prototype, "primaryKeyStrategy", null);
__decorate([
    VarOption("primaryKeyStrategy", Option("UseAutoIncrement"))
], SimpleEerToRelational.prototype, "useAutoIncrement", null);
__decorate([
    VarOption("primaryKeyStrategy", Option("UseManualIncrement"))
], SimpleEerToRelational.prototype, "useManualIncrement", null);
__decorate([
    VarPoint("NamingConvention")
], SimpleEerToRelational.prototype, "applyNaming", null);
__decorate([
    VarOption("applyNaming", Option("CamelCase"))
], SimpleEerToRelational.prototype, "applyCamelCaseNaming", null);
__decorate([
    VarOption("applyNaming", Option("SnakeCase"))
], SimpleEerToRelational.prototype, "applySnakeCaseNaming", null);
SimpleEerToRelational = __decorate([
    M2M()
], SimpleEerToRelational);
export { SimpleEerToRelational };
//# sourceMappingURL=transformation.js.map