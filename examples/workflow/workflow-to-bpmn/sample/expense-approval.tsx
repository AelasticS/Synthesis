/** @jsx createExprNode */

/**
 * The suite's richer sample: definitions and invocations, control
 * flow, and document bindings in one model. The Archive task is
 * defined once and invoked twice (two occurrences of one definition,
 * named ArchiveHighValue and ArchiveStandard); the ManagerSignoff
 * process is invoked through the SubProcess sugar; the loop repeats
 * the signoff round until approved; the choice guards the high-value
 * path, its guardless branch being the else; the report document is
 * typed by the ExpenseReport document type and bound through
 * reads/writes.
 */
import { createExprNode } from '@aelastics/synthesis/jsx'
import type { ExprNode } from '@aelastics/synthesis/jsx'
import type { ModelStore } from '@aelastics/synthesis/store'
import type { SynthHeaderInput } from '@aelastics/synthesis/envelope'
import {
  WorkflowModel, DocumentType, Task, Process, Document,
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
    <DocumentType name="ExpenseReport" />
    <Task name="Archive" performer="Clerk"
          inputs={[<DocumentType $refByName="ExpenseReport" />]} />
    <Process name="ManagerSignoff" performer="Manager"
             inputs={[<DocumentType $refByName="ExpenseReport" />]}
             outputs={[<DocumentType $refByName="ExpenseReport" />]}>
      <Task name="CheckBudget" />
      <Task name="Sign" />
    </Process>
    <Process name="HandleExpense">
      <Document name="report" documentType={<DocumentType $refByName="ExpenseReport" />} />
      <Task name="Submit" />
      <Loop kind="repeatUntil" guard="approved">
        <SubProcess $refByName="ManagerSignoff"
                    reads={[<Document $refByName="report" />]}
                    writes={[<Document $refByName="report" />]} />
      </Loop>
      <Choice>
        <Branch guard="amount > 1000">
          <Task name="NotifyFinance" />
          <Invoke name="ArchiveHighValue" activity={<Task $refByName="Archive" />}
                  reads={[<Document $refByName="report" />]} />
        </Branch>
        <Branch>
          <Invoke name="ArchiveStandard" activity={<Task $refByName="Archive" />}
                  reads={[<Document $refByName="report" />]} />
        </Branch>
      </Choice>
    </Process>
  </WorkflowModel>
)
