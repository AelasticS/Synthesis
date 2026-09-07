/*
 * Organizational metamodel, the source of the paper's approval example:
 * an organization is a hierarchy of units (the parent/subUnits inverse)
 * with workers as members (the worksIn/members inverse). A Department
 * is a unit run by a manager; a Board is a unit governed by its members
 * collectively, which is why it declares no manager. The org-to-approval
 * transformation reads this hierarchy upward to derive an approval
 * process.
 */
import * as t from "@aelastics/types";
import { ModelElement, Model } from "@aelastics/synthesis/metamodel";
export const Org_TypeSchema = t.schema("OrgSchema");
// A worker belongs to at most one unit; the link is filled by nesting
// (the members inverse), so it is type-level optional.
export const Worker = t.subtype(ModelElement, {
    role: t.optional(t.string),
    worksIn: t.optional(t.link(Org_TypeSchema, "OrgUnit")),
}, "Worker", Org_TypeSchema);
// A unit of the hierarchy: parent is authored as a reference prop (the
// root has none, so it is optional for real); subUnits is its inverse.
export const OrgUnit = t.subtype(ModelElement, {
    parent: t.optional(t.link(Org_TypeSchema, "OrgUnit")),
    subUnits: t.arrayOf(t.link(Org_TypeSchema, "OrgUnit")),
    members: t.arrayOf(Worker),
}, "OrgUnit", Org_TypeSchema);
// Semantically every department names its manager; type-level optional
// because the manager is a member of the department itself, so the
// link is filled only after the workers exist, later in the model (the
// creation-order regime). The declared constraint below requires it.
export const Department = t.subtype(OrgUnit, {
    manager: t.optional(t.link(Org_TypeSchema, "Worker")),
}, "Department", Org_TypeSchema);
// A board decides collectively: its members are its approvers, so
// there is no manager.
export const Board = t.subtype(OrgUnit, {}, "Board", Org_TypeSchema);
// The model root; topUnit names the hierarchy's root unit. Type-level
// optional (the unit must exist before the reference), required by the
// declared constraint below.
export const Organization = t.subtype(Model, {
    topUnit: t.optional(t.link(Org_TypeSchema, "OrgUnit")),
}, "Organization", Org_TypeSchema);
t.inverseProps(OrgUnit, "parent", OrgUnit, "subUnits");
t.inverseProps(Worker, "worksIn", OrgUnit, "members");
// ── declared constraints ─────────────────────────────────────────────
// Declared on the types, run only in a validation traversal: while a
// model renders it is legitimately incomplete (the manager exists only
// after the department's workers), so these are judgments about the
// finished model, never authoring-time checks.
Department.addValidator({
    predicate: (v) => v.manager !== undefined && v.manager !== null,
    message: (_v, label) => `${label ?? "Department"}: a department names its manager`,
});
Organization.addValidator({
    predicate: (v) => v.topUnit !== undefined && v.topUnit !== null,
    message: (_v, label) => `${label ?? "Organization"}: an organization names its top unit`,
});
//# sourceMappingURL=org.meta.model.type.js.map