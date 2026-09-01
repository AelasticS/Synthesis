/** @jsx createExprNode */
/**
 * Tutorial Part 1: a simple EER to relational transformation with fixed
 * logic and no decorators. Entities become tables, attributes become
 * columns typed by their domains, and relationships are mapped by one
 * plain conditional: M:N becomes a join table, everything else becomes
 * a foreign key on the N side. Later tutorial parts dissolve exactly
 * this conditional into specialized and configuration-based rules.
 */
import { createExprNode } from '@aelastics/synthesis/jsx';
import { abstractM2M } from '@aelastics/synthesis/m2m';
import * as em from '@synthesis/standard-metamodels/eer-tutorial/basic/model';
import { RelSchema, Table, Column } from '@synthesis/standard-metamodels/rel-tutorial/components';
export class EER2RelBasicTransformation extends abstractM2M {
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
    entityToTable(e) {
        return (createExprNode(Table, { name: e.name }, e.attributes.map((a) => this.attributeToColumn(a))));
    }
    attributeToColumn(a) {
        return (createExprNode(Column, { name: a.name, type: this.columnType(a.attrDomain), isKey: a.isKey, isAutoincrement: a.isKey, isNullable: !a.isKey }));
    }
    // The fixed relationship logic of Part 1: one conditional decides the
    // mapping. Part 2 turns rule variants into type-dispatched
    // specializations, and Part 3 turns the genuinely open case into a
    // configuration-based rule.
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
//# sourceMappingURL=transformation.js.map