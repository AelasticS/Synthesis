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
import { createExprNode, Resolve } from "@aelastics/synthesis/jsx";
import { VarPoint, VarOption, Option, DecisionAwareM2M } from "@aelastics/synthesis/variability";
import { M2M, SpecPoint, SpecOption } from "@aelastics/synthesis/m2m";
import * as et from "simple-eer-metamodel/model";
import * as r from "simple-relational-metamodel";
let EerToRelational = class EerToRelational extends DecisionAwareM2M {
    constructor(store, {}, decisionModel) {
        super(store, {}, decisionModel);
    }
    main(s) {
        return (createExprNode(r.RelSchema, { name: `${s.name}_Relational_Schema_with_Decision_Model` },
            s.elements
                .filter((el) => this.context.store.isTypeOf(el, et.Entity))
                .map((el) => this.Entity2Table(el)),
            s.elements
                .filter((el) => this.context.store.isTypeOf(el, et.WeakMapping))
                .map((el) => this.WeekMappingToFK(el)),
            s.elements
                .filter((el) => this.context.store.isTypeOf(el, et.Relationship))
                .map((el) => this.RelationshipToElement(el))));
    }
    // @E2E({
    //   input: et.Entity,
    //   output: rt.Table,
    //   ruleName: "Entity2Table"
    // })
    Entity2Table(e) {
        return (createExprNode(r.Table, { name: e.name }, e.attributes.map((a) => this.Attribute2Column(a))));
    }
    // @E2E({ input: et.Kernel, output: rt.Table })
    Kernel2Table(k) {
        // inherit table name and column from super rule
        return createExprNode(r.Table, { name: `k_${k.name}` });
    }
    // @E2E({ input: et.Weak, output: rt.Table })
    Week2Table(w) {
        // TODO Formiraj slozeni kljuc od kljuca jakog objekta i svog kljuca. Ovo vazi pod uslov da se prvo obidju svi kerneli, pa onda slabi.
        // Ovo sve vazi pod ogranicenjem da weak moze zavisiti samo od kernela, a nema podtipova i agregacija u modelu
        return (createExprNode(r.Table, { name: `w_${w.name}` }));
    }
    // @E2E({ input: et.WeakMapping, output: rt.ForeignKey })
    WeekMappingToFK(wm) {
        // override table name from super rule
        const parentKeyAttributes = wm.domain?.attributes?.filter((attr) => attr.isKey == true);
        // let a = this.context.resolveJSXElement(wm.domain);
        return createExprNode(Resolve, { name: "res1", input: wm.domain, ruleName: "Entity2Table" }, (refTable) => (createExprNode(Resolve, { name: "res2", input: wm.codomain, ruleName: "Entity2Table" }, (ownerTable) => (createExprNode(r.ForeignKey, { name: `for_key_ref_${refTable.name}`, referencedTable: createExprNode(r.Table, { "$refByName": refTable.name }), ownerTable: createExprNode(r.Table, { "$refByName": ownerTable.name }) },
            parentKeyAttributes.map((attribute) => (this.Attribute2PKColumn(attribute, ownerTable))),
            parentKeyAttributes.map((attribute) => (this.Attribute2FKColumn(attribute))))))));
        { /* // TODO Resolve should have trasformation (rule) name, in case when some ModelElement can be transformed by multiple rules.
        In this case, attribute from kernel will be transformed by Attribute2Column rule, and by Week2Table(Entity2Table rule)
    
        How to find a target JSX element (fk column) in case when one table has FK in more than one table? FK is a result of transformation of Association, and one FK can be
        target of one association
        */
        }
    }
    // @E2E({ input: et.Attribute, output: rt.Column })
    Attribute2Column(a) {
        return createExprNode(r.Column, { name: a.name, isKey: a.isKey });
    }
    // @E2E({ input: et.Attribute, output: rt.Column })
    Attribute2PKColumn(a, ownerTable) {
        return createExprNode(r.Column, { name: `fk_${a.name}`, isKey: true, ownerTable: createExprNode(r.Table, { "$refByName": ownerTable.name }) });
    }
    // @E2E({ input: et.Attribute, output: rt.ForeignKeyColumn })
    Attribute2FKColumn(a) {
        return createExprNode(Resolve, { input: a, ruleName: "Attribute2Column" }, (refColumn) => (createExprNode(Resolve, { input: a, ruleName: "Attribute2PKColumn" }, (fkColumn) => (createExprNode(r.ForeignKeyColumn, { name: `fk_col_${a.name}`, fkColumn: createExprNode(r.Column, { "$refByName": fkColumn.name }), refColumn: createExprNode(r.Column, { "$refByName": refColumn.name }) })))));
    }
    RelationshipToElement(rel) {
        throw new Error("Not implemented VarOptions for VarPoint FKorTable");
        // return null as unknown as ExprNode<rt.IForeignKey> | ExprNode<rt.ITable>;
    }
    // TODO Input for this rule expression should be DecisionForElement OR array of SelectedOption
    RelatioshipToFK(rel) {
        // const aaa = this.context.resolve(rel.ordinaryMapping[0]);
        return (createExprNode(r.ForeignKey, null,
            createExprNode(r.Table, { "$refByName": "" })));
    }
    // TODO Type of decision should be defined by type of element (e.g. Relationship, Entity, etc.) or by specific element (e.g. RelationshipWorksIn, etc.)
    RelatioshipToTable(rel) {
        const codomain = et.getCodomain(rel.roles[0]);
        const domain = et.getInverse(rel.roles[0]);
        return createExprNode(r.Table, { name: "RelationshipToElement table" });
    }
};
__decorate([
    SpecPoint()
], EerToRelational.prototype, "Entity2Table", null);
__decorate([
    SpecOption("Entity2Table", et.Kernel)
], EerToRelational.prototype, "Kernel2Table", null);
__decorate([
    SpecOption("Entity2Table", et.Weak)
], EerToRelational.prototype, "Week2Table", null);
__decorate([
    VarPoint('Neki Issue')
], EerToRelational.prototype, "RelationshipToElement", null);
__decorate([
    VarOption("RelationshipToElement", Option('nekiOption'))
], EerToRelational.prototype, "RelatioshipToFK", null);
__decorate([
    VarOption("RelationshipToElement", Option('nekiOption'))
], EerToRelational.prototype, "RelatioshipToTable", null);
EerToRelational = __decorate([
    M2M()
], EerToRelational);
export { EerToRelational };
//# sourceMappingURL=transformation.js.map