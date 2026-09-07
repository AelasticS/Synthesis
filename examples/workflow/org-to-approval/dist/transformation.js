var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
/** @jsx createExprNode */
import { createExprNode } from '@aelastics/synthesis/jsx';
import { abstractM2M, E2E, SpecPoint, SpecOption } from '@aelastics/synthesis/m2m';
import * as ot from 'org-metamodel/model';
import { WorkflowModel, Process, Task, Parallel } from 'workflow-metamodel';
export class OrgToApprovalTransformation extends abstractM2M {
    constructor(store) {
        super(store);
    }
    template(m) {
        const param = this.approvalParam();
        const worker = this.workerNamed(m, param.worker);
        const chain = this.unitChainOf(worker, param.sensitivity);
        return (createExprNode(WorkflowModel, { name: `ApprovalFor${worker.name}`, store: this.context.store },
            createExprNode(Process, { name: `ApprovalFor${worker.name}` },
                createExprNode(Task, { name: "WriteDocument", performer: worker.name }),
                chain.map((u) => this.OrgUnit2Approval(u)))));
    }
    // ----- the approval rule: one step per unit, specialized per kind ------
    OrgUnit2Approval(u) {
        return undefined; // pure dispatcher: the matching option supplies the result
    }
    // A department's approval is one task, its manager's.
    Department2Approval(d) {
        const manager = d.manager;
        if (!manager) {
            throw new Error(`Department '${d.name}' names no manager ('synth model validate' reports this on the source model)`);
        }
        return createExprNode(Task, { name: `ApproveBy${manager.name}`, performer: manager.name });
    }
    // A board approves collectively: every member's approval task, in
    // parallel. The block is named from the board's label, the authored
    // spaced form, so the drawings label it naturally.
    Board2Approval(b) {
        const members = (b.members ?? []);
        if (members.length === 0) {
            throw new Error(`Board '${b.name}' has no members to approve`);
        }
        return (createExprNode(Parallel, { name: `${b.label ?? b.name} approvals` }, members.map((w) => (createExprNode(Task, { name: `ApproveBy${w.name}`, performer: w.name })))));
    }
    // ----- small helpers ---------------------------------------------------
    // The parameter arrives as parsed JSON, untyped; the shape is checked
    // here so the message can teach the expected form.
    approvalParam() {
        const p = this.context.param;
        if (p === undefined || p === null) {
            throw new Error(`org-to-approval is parameterized: pass --param '{"worker":"<name>","sensitivity":<levels>}'`);
        }
        const { worker, sensitivity } = p;
        if (typeof worker !== 'string' || worker === '') {
            throw new Error(`The parameter names no worker: expected {"worker":"<name>","sensitivity":<levels>}, got ${JSON.stringify(p)}`);
        }
        if (typeof sensitivity !== 'number' || !Number.isInteger(sensitivity) || sensitivity < 1) {
            throw new Error(`The parameter's sensitivity must be a positive integer (the number of approval levels), got ${JSON.stringify(p)}`);
        }
        return { worker, sensitivity };
    }
    // A CLI parameter is JSON, so it names the worker rather than
    // referencing the element; the resolution happens here, and a miss
    // lists the workers the organization knows.
    workerNamed(m, name) {
        const store = this.context.store;
        const workers = (m.elements ?? []).filter((el) => store.isTypeOf(el, ot.Worker));
        const worker = workers.find((w) => w.name === name);
        if (!worker) {
            throw new Error(`Organization '${m.name}' has no worker named '${name}'; it knows: ${workers
                .map((w) => w.name)
                .join(', ')}`);
        }
        return worker;
    }
    // The worker's unit chain unfolded upward: the unit the worker works
    // in, then its parents, sensitivity levels deep or until the
    // hierarchy's root.
    unitChainOf(worker, sensitivity) {
        let unit = worker.worksIn;
        if (!unit) {
            throw new Error(`Worker '${worker.name}' works in no unit; there is no approval chain to derive`);
        }
        const chain = [];
        while (unit && chain.length < sensitivity) {
            chain.push(unit);
            unit = unit.parent;
        }
        return chain;
    }
}
__decorate([
    E2E(),
    SpecPoint()
], OrgToApprovalTransformation.prototype, "OrgUnit2Approval", null);
__decorate([
    SpecOption('OrgUnit2Approval', ot.Department)
], OrgToApprovalTransformation.prototype, "Department2Approval", null);
__decorate([
    SpecOption('OrgUnit2Approval', ot.Board)
], OrgToApprovalTransformation.prototype, "Board2Approval", null);
//# sourceMappingURL=transformation.js.map