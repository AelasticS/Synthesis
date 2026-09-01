/** @jsx createExprNode */
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
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
import { createExprNode } from '@aelastics/synthesis/jsx-runtime';
import { E2E, SpecPoint, SpecOption, M2M } from '@aelastics/synthesis/engine';
import { DecisionAwareM2M, VarPoint, VarOption, Default, Option } from '@aelastics/synthesis/decision-framework';
import * as em from '@synthesis/standard-metamodels/eer-tutorial/advanced/model';
import { RelSchema, Table, Column } from '@synthesis/standard-metamodels/rel-tutorial/components';
let EER2RelConfigurableTransformation = class EER2RelConfigurableTransformation extends DecisionAwareM2M {
    // A configuration-based transformation takes the run's configuration
    // model as a third argument. It is optional: without one, every
    // variation point falls back to its @Default option.
    constructor(store, {}, configModel) {
        super(store, {}, configModel);
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
    // Unchanged from Part 2: the specialization point, the table skeleton
    // every entity produces. @E2E stays outermost so it traces the merged
    // result.
    entityToTable(e) {
        return (createExprNode(Table, { name: e.name }, e.attributes.map((a) => this.attributeToColumn(a))));
    }
    // A kernel entity is independent, so the skeleton is already the whole
    // table. The option still has to exist: dispatch is total.
    kernelToTable(k) {
        return createExprNode(Table, null);
    }
    // A weak entity is identified relative to its owner, so its table adds
    // a foreign key to the owner's key, and that column takes part in the
    // primary key next to the entity's own partial key.
    weakToTable(w) {
        return (createExprNode(Table, null,
            createExprNode(Column, { name: `${w.name}_${w.owner.name}Id_FK`, type: this.columnType(this.keyAttributeOf(w.owner).attrDomain), isKey: true, isNullable: false, isAutoincrement: false, references: createExprNode(Column, { "$refByName": this.keyAttributeOf(w.owner).name }) })));
    }
    attributeToColumn(a) {
        return (createExprNode(Column, { name: a.name, type: this.columnType(a.attrDomain), isKey: a.isKey, isAutoincrement: a.isKey, isNullable: !a.isKey }));
    }
    // The line between fixed logic and an open decision. An M:N
    // relationship cannot be carried by a foreign key column on either
    // side, so the join table is structurally forced and the branch stays
    // plain code. Everything else reaching this rule is 1:N, and there the
    // structure is a design choice, so the rule hands over to a variation
    // point.
    relationshipToStructure(rel) {
        const [role1, role2] = rel.roles;
        if (role1.ub === 'M' && role2.ub === 'M') {
            return this.relationshipAsJoinTable(rel);
        }
        return this.oneToManyMapping(rel);
    }
    // The variation point. Its body is never executed: the engine looks up
    // the option selected for this relationship in the run's configuration
    // model and calls that method instead. @E2E is outermost so the trace
    // records which option was taken; @VarPoint must be inner so it
    // registers its options bucket before the @VarOption decorators run.
    oneToManyMapping(rel) {
        throw new Error('No option selected for the OneToManyStrategy variation point');
    }
    // The default option, matching isDefault on ForeignKey in the decision
    // model: the N side gains a foreign key column pointing at the 1 side.
    oneToManyAsForeignKey(rel) {
        const fkSide = rel.roles.find((r) => r.ub === '1') ?? rel.roles[0];
        const pkSide = rel.roles.find((r) => r !== fkSide) ?? rel.roles[1];
        return (createExprNode(Table, { "$refByName": pkSide.domain.name },
            createExprNode(Column, { name: `${fkSide.domain.name}Id_FK`, type: this.columnType(this.keyAttributeOf(fkSide.domain).attrDomain), isKey: false, isNullable: fkSide.lb === '0', isAutoincrement: false, references: createExprNode(Column, { "$refByName": this.keyAttributeOf(fkSide.domain).name }) })));
    }
    // The alternative option: the same join table an M:N relationship gets.
    // A 1:N relationship in a table of its own costs a join on every read
    // but keeps the N side free of the reference, which is what makes this
    // a design decision rather than a derivable fact.
    oneToManyAsJoinTable(rel) {
        return this.relationshipAsJoinTable(rel);
    }
    // Fixed logic, shared by the M:N branch and the JoinTable option.
    // Column names are qualified by the relationship, the way the weak
    // entity rule qualifies its owner key with the entity name. Once 1:N
    // relationships may become join tables too, one schema can hold two
    // join tables that both reference Book, and column names are unique
    // per schema.
    relationshipAsJoinTable(rel) {
        return (createExprNode(Table, { name: rel.name }, rel.roles.map((role) => (createExprNode(Column, { name: `${rel.name}_${role.domain.name}Id_FK`, type: this.columnType(this.keyAttributeOf(role.domain).attrDomain), isKey: false, isNullable: false, isAutoincrement: false, references: createExprNode(Column, { "$refByName": this.keyAttributeOf(role.domain).name }) })))));
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
};
__decorate([
    E2E(),
    SpecPoint()
], EER2RelConfigurableTransformation.prototype, "entityToTable", null);
__decorate([
    SpecOption('entityToTable', em.Kernel)
], EER2RelConfigurableTransformation.prototype, "kernelToTable", null);
__decorate([
    SpecOption('entityToTable', em.Weak)
], EER2RelConfigurableTransformation.prototype, "weakToTable", null);
__decorate([
    E2E(),
    VarPoint('OneToManyStrategy')
], EER2RelConfigurableTransformation.prototype, "oneToManyMapping", null);
__decorate([
    Default(),
    VarOption('oneToManyMapping', Option('ForeignKey'))
], EER2RelConfigurableTransformation.prototype, "oneToManyAsForeignKey", null);
__decorate([
    VarOption('oneToManyMapping', Option('JoinTable'))
], EER2RelConfigurableTransformation.prototype, "oneToManyAsJoinTable", null);
EER2RelConfigurableTransformation = __decorate([
    M2M()
], EER2RelConfigurableTransformation);
export { EER2RelConfigurableTransformation };
//# sourceMappingURL=transformation.js.map