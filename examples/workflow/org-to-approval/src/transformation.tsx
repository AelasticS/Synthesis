/** @jsx createExprNode */
import { createExprNode } from '@aelastics/synthesis/jsx'
import type { ExprNode } from '@aelastics/synthesis/jsx'
import { abstractM2M, E2E, SpecPoint, SpecOption } from '@aelastics/synthesis/m2m'
import type { ModelStore } from '@aelastics/synthesis/store'
import * as ot from 'org-metamodel/model'
import * as wt from 'workflow-metamodel/model'
import { WorkflowModel, Process, Task, Parallel } from 'workflow-metamodel'

/** The run's parameter, handed through the engine's transform(source,
 * param) channel: whose document, and how many approval levels upward. */
export interface IApprovalParam {
  worker: string
  sensitivity: number
}

export class OrgToApprovalTransformation extends abstractM2M<
  ot.IOrganization,
  wt.IWorkflowModel,
  {},
  IApprovalParam
> {
  constructor(store: ModelStore) {
    super(store)
  }

  template(m: ot.IOrganization): ExprNode<ot.IOrganization, wt.IWorkflowModel> {
    const param = this.approvalParam()
    const worker = this.workerNamed(m, param.worker)
    const chain = this.unitChainOf(worker, param.sensitivity)
    return (
      <WorkflowModel name={`ApprovalFor${worker.name}`} store={this.context.store}>
        <Process name={`ApprovalFor${worker.name}`}>
          <Task name="WriteDocument" performer={worker.name as string} />
          {chain.map((u) => this.OrgUnit2Approval(u))}
        </Process>
      </WorkflowModel>
    )
  }

  // ----- the approval rule: one step per unit, specialized per kind ------

  @E2E()
  @SpecPoint()
  OrgUnit2Approval(u: ot.IOrgUnit): ExprNode<wt.IStep> {
    return undefined! // pure dispatcher: the matching option supplies the result
  }

  // A department's approval is one task, its manager's.
  @SpecOption('OrgUnit2Approval', ot.Department)
  Department2Approval(d: ot.IDepartment): ExprNode<wt.ITask> {
    const manager = d.manager as ot.IWorker | undefined
    if (!manager) {
      throw new Error(
        `Department '${d.name}' names no manager ('synth model validate' reports this on the source model)`
      )
    }
    return <Task name={`ApproveBy${manager.name}`} performer={manager.name as string} />
  }

  // A board approves collectively: every member's approval task, in
  // parallel. The block is named from the board's label, the authored
  // spaced form, so the drawings label it naturally.
  @SpecOption('OrgUnit2Approval', ot.Board)
  Board2Approval(b: ot.IBoard): ExprNode<wt.IParallel> {
    const members = (b.members ?? []) as ot.IWorker[]
    if (members.length === 0) {
      throw new Error(`Board '${b.name}' has no members to approve`)
    }
    return (
      <Parallel name={`${b.label ?? b.name} approvals`}>
        {members.map((w) => (
          <Task name={`ApproveBy${w.name}`} performer={w.name as string} />
        ))}
      </Parallel>
    )
  }

  // ----- small helpers ---------------------------------------------------

  // The parameter arrives as parsed JSON, untyped; the shape is checked
  // here so the message can teach the expected form.
  private approvalParam(): IApprovalParam {
    const p = this.context.param as unknown
    if (p === undefined || p === null) {
      throw new Error(
        `org-to-approval is parameterized: pass --param '{"worker":"<name>","sensitivity":<levels>}'`
      )
    }
    const { worker, sensitivity } = p as { worker?: unknown; sensitivity?: unknown }
    if (typeof worker !== 'string' || worker === '') {
      throw new Error(
        `The parameter names no worker: expected {"worker":"<name>","sensitivity":<levels>}, got ${JSON.stringify(p)}`
      )
    }
    if (typeof sensitivity !== 'number' || !Number.isInteger(sensitivity) || sensitivity < 1) {
      throw new Error(
        `The parameter's sensitivity must be a positive integer (the number of approval levels), got ${JSON.stringify(p)}`
      )
    }
    return { worker, sensitivity }
  }

  // A CLI parameter is JSON, so it names the worker rather than
  // referencing the element; the resolution happens here, and a miss
  // lists the workers the organization knows.
  private workerNamed(m: ot.IOrganization, name: string): ot.IWorker {
    const store = this.context.store
    const workers = ((m.elements ?? []) as ot.IWorker[]).filter((el) => store.isTypeOf(el, ot.Worker))
    const worker = workers.find((w) => w.name === name)
    if (!worker) {
      throw new Error(
        `Organization '${m.name}' has no worker named '${name}'; it knows: ${workers
          .map((w) => w.name)
          .join(', ')}`
      )
    }
    return worker
  }

  // The worker's unit chain unfolded upward: the unit the worker works
  // in, then its parents, sensitivity levels deep or until the
  // hierarchy's root.
  private unitChainOf(worker: ot.IWorker, sensitivity: number): ot.IOrgUnit[] {
    let unit = worker.worksIn as ot.IOrgUnit | undefined
    if (!unit) {
      throw new Error(`Worker '${worker.name}' works in no unit; there is no approval chain to derive`)
    }
    const chain: ot.IOrgUnit[] = []
    while (unit && chain.length < sensitivity) {
      chain.push(unit)
      unit = unit.parent as ot.IOrgUnit | undefined
    }
    return chain
  }
}
