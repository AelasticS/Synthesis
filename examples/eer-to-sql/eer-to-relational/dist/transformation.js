/** @jsx createExprNode */
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
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
import { createExprNode } from "@aelastics/synthesis/jsx";
import { VarPoint, VarOption, Default, Option, DecisionAwareM2M } from "@aelastics/synthesis/variability";
import { Relationship, Entity, } from "eer-metamodel/model";
import { E2E, M2M } from "@aelastics/synthesis/m2m";
import { RelSchema, Table, Column } from "relational-metamodel";
let EER2RelDomainWithDecisionTransformation = class EER2RelDomainWithDecisionTransformation extends DecisionAwareM2M {
    constructor(store, {}, configModel) {
        super(store, {}, configModel);
    }
    template(s) {
        return (createExprNode(RelSchema, { name: `${s.name}_Relational_Schema_with_Decision_Model`, content: "", MDA_level: "M1", store: this.context.store },
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
        return createExprNode(Column, { name: this.applyNaming(a.name), isKey: a.isKey, isAutoincrement: this.primaryKeyStrategy(a), type: this.getColumnType(a.attrDomain) });
    }
    // @E2E is outermost: wraps the VarPoint dispatcher, so tracing happens after VarPoint selects
    // and calls the matching VarOption method. @VarPoint must be inner (applied first) so it
    // registers its options bucket in the registry before @VarOption decorators run on later methods.
    RelationshipMapping(rel) {
        throw new Error("Not implemented VarOptions for VarPoint RelationshipMapping");
    }
    // Element names are unique across the whole model, not per table, so
    // foreign key columns are qualified with the relationship name. Without
    // that, two relationships referencing the same entity would produce the
    // same column name and the render would fail on a duplicate.
    relationshipAsForeignKey(rel) {
        const fkSide = this.getFKSide(rel);
        const pkSide = this.getPKSide(rel);
        return (createExprNode(Table, { "$refByName": this.applyNaming(pkSide.domain.name) },
            createExprNode(Column, { name: this.applyNaming(rel.name + "_" + fkSide.domain.name + "Id_FK"), type: this.keyColumnType(fkSide.domain), isForeignKey: true, isKey: false, references: this.applyNaming(fkSide.domain.name), isNullable: fkSide.lb === "0" })));
    }
    relationshipAsJoinTable(rel) {
        const role1 = rel.roles[0];
        const role2 = rel.roles[1];
        return (createExprNode(Table, { name: this.applyNaming(rel.name) },
            createExprNode(Column, { name: this.applyNaming(rel.name + "_" + role1.domain.name + "Id_FK"), type: this.keyColumnType(role1.domain), isForeignKey: true, references: this.applyNaming(role1.domain.name), isNullable: role1.lb !== "1" && role1.ub !== "1", isKey: role1.ub === "1" }),
            createExprNode(Column, { name: this.applyNaming(rel.name + "_" + role2.domain.name + "Id_FK"), type: this.keyColumnType(role2.domain), isForeignKey: true, references: this.applyNaming(role2.domain.name), isNullable: role2.lb !== "1", isKey: role2.ub === "1" })));
    }
    // ######### START PrimaryKeyStrategy variations #############
    primaryKeyStrategy(a) {
        throw new Error("Not implemented VarOptions for VarPoint PrimaryKeyStrategy");
    }
    useAutoIncrement(a) {
        return a.isKey ? true : false;
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
        // The side with upper bound 1 carries the foreign key
        return rel.roles.find((m) => m.ub === "1") || rel.roles[0];
    }
    getPKSide(rel) {
        // The side with upper bound N receives the foreign key column
        return rel.roles.find((m) => m.ub !== "1") || rel.roles[1];
    }
    keyColumnType(entity) {
        // A foreign key column has the type of the referenced entity's key attribute
        const key = entity.attributes.find((a) => a.isKey);
        return key ? this.getColumnType(key.attrDomain) : "VARCHAR(255)";
    }
    getColumnType(domain) {
        // Map EER domain types to relational column types
        const domainName = domain.name.toLowerCase();
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
                return "VARCHAR(255)";
        }
    }
};
__decorate([
    E2E()
], EER2RelDomainWithDecisionTransformation.prototype, "Entity2Table", null);
__decorate([
    E2E()
], EER2RelDomainWithDecisionTransformation.prototype, "Attribute2Column", null);
__decorate([
    E2E(),
    VarPoint("OneToManyStrategy")
], EER2RelDomainWithDecisionTransformation.prototype, "RelationshipMapping", null);
__decorate([
    Default(),
    VarOption("RelationshipMapping", Option("ForeignKey"))
], EER2RelDomainWithDecisionTransformation.prototype, "relationshipAsForeignKey", null);
__decorate([
    VarOption("RelationshipMapping", Option("JoinTable"))
], EER2RelDomainWithDecisionTransformation.prototype, "relationshipAsJoinTable", null);
__decorate([
    VarPoint("PrimaryKeyStrategy")
], EER2RelDomainWithDecisionTransformation.prototype, "primaryKeyStrategy", null);
__decorate([
    VarOption("primaryKeyStrategy", Option("UseAutoIncrement"))
], EER2RelDomainWithDecisionTransformation.prototype, "useAutoIncrement", null);
__decorate([
    VarOption("primaryKeyStrategy", Option("UseManualIncrement"))
], EER2RelDomainWithDecisionTransformation.prototype, "useManualIncrement", null);
__decorate([
    VarPoint("NamingConvention")
], EER2RelDomainWithDecisionTransformation.prototype, "applyNaming", null);
__decorate([
    VarOption("applyNaming", Option("CamelCase"))
], EER2RelDomainWithDecisionTransformation.prototype, "applyCamelCaseNaming", null);
__decorate([
    VarOption("applyNaming", Option("SnakeCase"))
], EER2RelDomainWithDecisionTransformation.prototype, "applySnakeCaseNaming", null);
EER2RelDomainWithDecisionTransformation = __decorate([
    M2M()
], EER2RelDomainWithDecisionTransformation);
export { EER2RelDomainWithDecisionTransformation };
//# sourceMappingURL=transformation.js.map