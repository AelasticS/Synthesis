/** @jsx createExprNode */
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
/**
 * Tutorial Part 2: the Part 1 transformation with its entity rule opened
 * up as a specialization point. The source metamodel now distinguishes
 * Kernel from Weak entities, and the two need different tables, so
 * `entityToTable` keeps only what every table shares and the
 * `@SpecOption` rules add what a subtype needs on top of it. The
 * relationship logic is still the plain conditional of Part 1; Part 3
 * turns that one into a configuration-based rule.
 */
import { createExprNode } from '@synthesis/jsx-runtime';
import { abstractM2M, E2E, SpecPoint, SpecOption } from '@synthesis/engine';
import * as em from '@synthesis/standard-metamodels/eer-tutorial/advanced/model';
import { RelSchema, Table, Column } from '@synthesis/standard-metamodels/rel-tutorial/components';
export class EER2RelAdvancedTransformation extends abstractM2M {
    constructor(store) {
        super(store);
    }
    template(s) {
        return (createExprNode(RelSchema, { name: `${s.name}_rel`, content: "", MDA_level: "M1", store: this.context.store },
            s.elements
                .filter((el) => this.context.store.isTypeOf(el, em.Entity))
                .map((el) => this.entityToTable(el)),
            s.elements
                .filter((el) => this.context.store.isTypeOf(el, em.Relationship))
                .map((el) => this.relationshipToStructure(el))));
    }
    // The specialization point: the table skeleton every entity produces,
    // a name plus one column per attribute. The engine calls it for any
    // entity, then merges the result with the option selected for the
    // entity's runtime type. @E2E stays outermost so it traces the merged
    // result.
    entityToTable(e) {
        return (createExprNode(Table, { name: e.name }, e.attributes.map((a) => this.attributeToColumn(a))));
    }
    // A kernel entity is independent: its own key attribute identifies it,
    // so the skeleton is already the whole table and this option adds
    // nothing. It still has to exist, because dispatch is total: an entity
    // with no matching option is an error, not a fall back to the base
    // rule.
    kernelToTable(k) {
        return createExprNode(Table, null);
    }
    // A weak entity is identified relative to its owner, so its table adds
    // a foreign key to the owner's key, and that column takes part in the
    // primary key next to the entity's own partial key. Name and attribute
    // columns come from the skeleton.
    weakToTable(w) {
        return (createExprNode(Table, null,
            createExprNode(Column, { name: `${w.name}_${w.owner.name}Id_FK`, type: this.columnType(this.keyAttributeOf(w.owner).attrDomain), isKey: true, isNullable: false, isAutoincrement: false, references: createExprNode(Column, { "$refByName": this.keyAttributeOf(w.owner).name }) })));
    }
    attributeToColumn(a) {
        return (createExprNode(Column, { name: a.name, type: this.columnType(a.attrDomain), isKey: a.isKey, isAutoincrement: a.isKey, isNullable: !a.isKey }));
    }
    // Unchanged from Part 1: one conditional still decides the mapping.
    // Relationship variants are a design choice, not a subtype of the
    // source element, so specialization cannot express them. Part 3 turns
    // this into a configuration-based rule.
    relationshipToStructure(rel) {
        const [role1, role2] = rel.roles;
        if (role1.ub === 'M' && role2.ub === 'M') {
            return this.relationshipAsJoinTable(rel);
        }
        return this.relationshipAsForeignKey(rel);
    }
    relationshipAsForeignKey(rel) {
        const fkSide = rel.roles.find((r) => r.ub === '1') ?? rel.roles[0];
        const pkSide = rel.roles.find((r) => r !== fkSide) ?? rel.roles[1];
        return (createExprNode(Table, { "$refByName": pkSide.domain.name },
            createExprNode(Column, { name: `${fkSide.domain.name}Id_FK`, type: this.columnType(this.keyAttributeOf(fkSide.domain).attrDomain), isKey: false, isNullable: fkSide.lb === '0', isAutoincrement: false, references: createExprNode(Column, { "$refByName": this.keyAttributeOf(fkSide.domain).name }) })));
    }
    relationshipAsJoinTable(rel) {
        return (createExprNode(Table, { name: rel.name }, rel.roles.map((role) => (createExprNode(Column, { name: `${role.domain.name}Id_FK`, type: this.columnType(this.keyAttributeOf(role.domain).attrDomain), isKey: false, isNullable: false, isAutoincrement: false, references: createExprNode(Column, { "$refByName": this.keyAttributeOf(role.domain).name }) })))));
    }
    // Domains carry the type information: a column's SQL type is derived
    // from the attribute's domain.
    columnType(domain) {
        switch (domain.name.toLowerCase()) {
            case 'number':
                return 'INTEGER';
            case 'string':
                return 'VARCHAR(255)';
            case 'boolean':
                return 'BOOLEAN';
            default:
                return 'VARCHAR(255)';
        }
    }
    // A foreign key points at the primary key column of the entity it
    // references, so that column has to exist: an entity without a key
    // attribute cannot be referenced at all.
    keyAttributeOf(entity) {
        const key = entity.attributes.find((a) => a.isKey);
        if (!key) {
            throw new Error(`Entity '${entity.name}' has no key attribute, so nothing can reference it`);
        }
        return key;
    }
}
__decorate([
    E2E(),
    SpecPoint()
], EER2RelAdvancedTransformation.prototype, "entityToTable", null);
__decorate([
    SpecOption('entityToTable', em.Kernel)
], EER2RelAdvancedTransformation.prototype, "kernelToTable", null);
__decorate([
    SpecOption('entityToTable', em.Weak)
], EER2RelAdvancedTransformation.prototype, "weakToTable", null);
//# sourceMappingURL=transformation.js.map