/** @jsx createExprNode */

/**
 * The suite's richer sample: definitions and invocations, control
 * flow, and data-object bindings in one model. The Archive task is
 * defined once and invoked twice (two occurrences of one definition,
 * named ArchiveHighValue and ArchiveStandard, the high-value one
 * overriding the definition's Clerk performer with Auditor); the
 * ManagerSignoff process is invoked through the SubProcess sugar; the
 * loop repeats the signoff round until approved; the choice guards
 * the high-value path, its guardless branch being the else; the
 * report data object names the ExpenseReport document and is bound
 * through reads/writes.
 */
import { createExprNode } from '@aelastics/synthesis/jsx'
import type { ExprNode } from '@aelastics/synthesis/jsx'
import type { ModelStore } from '@aelastics/synthesis/store'
import type { SynthHeaderInput } from '@aelastics/synthesis/envelope'
import {
  WorkflowModel, Document, Task, Process, DataObject,
  Choice, Branch, Loop, Invoke, SubProcess
} from 'workflow-metamodel'
import type * as wm from 'workflow-metamodel/model'

export const $synth = {
  kind: 'model',
  metamodel: 'workflow-metamodel',
  author: 'Sinisa Neskovic',
  version: '0.1.0',
  description: 'Expense approval: a guarded choice, a repeat-until loop, a twice-invoked shared task, and a bound report document'
} as const satisfies SynthHeaderInput

export default (store: ModelStore): ExprNode<wm.IWorkflowModel> => (
  <WorkflowModel name="ExpenseApproval" store={store}>
    <Document name="ExpenseReport" />
    <Task name="Archive" performer="Clerk"
          inputs={[<Document $refByName="ExpenseReport" />]} />
    <Process name="ManagerSignoff" performer="Manager"
             inputs={[<Document $refByName="ExpenseReport" />]}
             outputs={[<Document $refByName="ExpenseReport" />]}>
      <Task name="CheckBudget" />
      <Task name="Sign" />
    </Process>
    <Process name="HandleExpense">
      <DataObject name="report" document={<Document $refByName="ExpenseReport" />} />
      <Task name="Submit" />
      <Loop kind="repeatUntil" guard="approved">
        <SubProcess $refByName="ManagerSignoff"
                    reads={[<DataObject $refByName="report" />]}
                    writes={[<DataObject $refByName="report" />]} />
      </Loop>
      <Choice>
        <Branch guard="amount > 1000">
          <Task name="NotifyFinance" />
          <Invoke name="ArchiveHighValue" performer="Auditor"
                  activity={<Task $refByName="Archive" />}
                  reads={[<DataObject $refByName="report" />]} />
        </Branch>
        <Branch>
          <Invoke name="ArchiveStandard" activity={<Task $refByName="Archive" />}
                  reads={[<DataObject $refByName="report" />]} />
        </Branch>
      </Choice>
    </Process>
  </WorkflowModel>
)
