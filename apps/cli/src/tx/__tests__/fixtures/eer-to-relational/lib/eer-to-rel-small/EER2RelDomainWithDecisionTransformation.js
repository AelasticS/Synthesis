/** @jsx createExprNode */
/*
 * Copyright (c) AelasticS 2022.
 */
var __decorate = function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
// const EER = getEER({} as IModel, null)
import * as jsx_1 from "@aelastics/synthesis/jsx";
import * as variability_1 from "@aelastics/synthesis/variability";
import * as model_1 from "@synthesis/standard-metamodels/eer/model";
import * as m2m_1 from "@aelastics/synthesis/m2m";
import * as components_legacy_1 from "@synthesis/standard-metamodels/relational/components-legacy";
let EER2RelDomainWithDecisionTransformation = class EER2RelDomainWithDecisionTransformation extends variability_1.DecisionAwareM2M {
    constructor(store, {}, configModel) {
        super(store, {}, configModel);
    }
    template(s) {
        return ((0, jsx_1.createExprNode)(components_legacy_1.RelSchema, { name: `${s.name}_Relational_Schema_with_Decision_Model`, content: "", MDA_level: "M1", store: this.context.store },
            s.elements
                .filter((el) => this.context.store.isTypeOf(el, model_1.Entity))
                .map((el) => this.Entity2Table(el)),
            s.elements
                .filter((el) => this.context.store.isTypeOf(el, model_1.Relationship))
                .map((r) => this.RelationshipMapping(r))));
    }
    Entity2Table(e) {
        return (0, jsx_1.createExprNode)(components_legacy_1.Table, { name: this.applyNaming(e.name) }, e.attributes.map((a) => this.Attribute2Column(a)));
    }
    /*
  
  <TraceEntry
        source={<ModelElement $refByName={a.name} />}
        targets={[<ModelElement $refByName={a.name} />]}
        rule={target.constructor.name}
        ruleType={this.context.lastVarResolution?.ruleType || "RegularRule"}
      />
  
  
  
    */
    Attribute2Column(a) {
        return (0, jsx_1.createExprNode)(components_legacy_1.Column, { name: this.applyNaming(a.name), isKey: a.isKey, isAutoincrement: this.primaryKeyStrategy(a), type: this.getColumnType(a.attrDomain) });
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
        return ((0, jsx_1.createExprNode)(components_legacy_1.Table, { "$refByName": this.applyNaming(pkSide.domain.name) },
            (0, jsx_1.createExprNode)(components_legacy_1.Column, { name: this.applyNaming(fkSide.domain.name + "Id_FK"), type: this.getColumnType(fkSide.domain), isForeignKey: true, isKey: false, references: this.applyNaming(fkSide.domain.name), isNullable: fkSide.lb === "0" })));
    }
    relationshipAsJoinTable(rel) {
        const role1 = rel.roles[0];
        const role2 = rel.roles[1];
        return ((0, jsx_1.createExprNode)(components_legacy_1.Table, { name: this.applyNaming(rel.name) },
            (0, jsx_1.createExprNode)(components_legacy_1.Column, { name: this.applyNaming(role1.domain.name + "Id_FK"), type: this.getColumnType(role1), isForeignKey: true, references: this.applyNaming(role1.domain.name), isNullable: role1.lb !== "1" && role1.ub !== "1", isKey: role1.ub === "1" }),
            (0, jsx_1.createExprNode)(components_legacy_1.Column, { name: this.applyNaming(role2.domain.name + "Id_FK"), type: this.getColumnType(role2), isForeignKey: true, references: this.applyNaming(role2.domain.name), isNullable: role2.lb !== "1", isKey: role2.ub === "1" })));
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
        // Return the side with upperBound = 1 (many-to-one side becomes FK side)
        return rel.roles.find((m) => m.ub === "1") || rel.roles[0];
    }
    getPKSide(rel) {
        // Return the side with upperBound = N (one-to-many side becomes PK side)
        return rel.roles.find((m) => m.ub !== "1") || rel.roles[1];
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
                return "VARCHAR(255)"; // Default fallback
        }
    }
};
__decorate([
    (0, m2m_1.E2E)()
], EER2RelDomainWithDecisionTransformation.prototype, "Entity2Table", null);
__decorate([
    (0, m2m_1.E2E)()
], EER2RelDomainWithDecisionTransformation.prototype, "Attribute2Column", null);
__decorate([
    (0, m2m_1.E2E)(),
    (0, variability_1.VarPoint)("OneToManyStrategy")
], EER2RelDomainWithDecisionTransformation.prototype, "RelationshipMapping", null);
__decorate([
    (0, variability_1.Default)(),
    (0, variability_1.VarOption)("RelationshipMapping", (0, variability_1.Option)("ForeignKey"))
], EER2RelDomainWithDecisionTransformation.prototype, "relationshipAsForeignKey", null);
__decorate([
    (0, variability_1.VarOption)("RelationshipMapping", (0, variability_1.Option)("JoinTable"))
], EER2RelDomainWithDecisionTransformation.prototype, "relationshipAsJoinTable", null);
__decorate([
    (0, variability_1.VarPoint)("PrimaryKeyStrategy")
], EER2RelDomainWithDecisionTransformation.prototype, "primaryKeyStrategy", null);
__decorate([
    (0, variability_1.VarOption)("primaryKeyStrategy", (0, variability_1.Option)("UseAutoIncrement"))
], EER2RelDomainWithDecisionTransformation.prototype, "useAutoIncrement", null);
__decorate([
    (0, variability_1.VarOption)("primaryKeyStrategy", (0, variability_1.Option)("UseManualIncrement"))
], EER2RelDomainWithDecisionTransformation.prototype, "useManualIncrement", null);
__decorate([
    (0, variability_1.VarPoint)("NamingConvention")
], EER2RelDomainWithDecisionTransformation.prototype, "applyNaming", null);
__decorate([
    (0, variability_1.VarOption)("applyNaming", (0, variability_1.Option)("CamelCase"))
], EER2RelDomainWithDecisionTransformation.prototype, "applyCamelCaseNaming", null);
__decorate([
    (0, variability_1.VarOption)("applyNaming", (0, variability_1.Option)("SnakeCase"))
], EER2RelDomainWithDecisionTransformation.prototype, "applySnakeCaseNaming", null);
EER2RelDomainWithDecisionTransformation = __decorate([
    (0, m2m_1.M2M)()
], EER2RelDomainWithDecisionTransformation);
export { EER2RelDomainWithDecisionTransformation };