/** @jsx createExprNode */
/*
 * Copyright (c) AelasticS 2022.
 */

import { createExprNode } from "@synthesis/jsx-runtime"
import * as t from "@aelastics/types"
import { Process, Sequence, Task, Document, OutputDocument, InputDocument, Parallel } from "@synthesis/standard-metamodels/bpm"
import { IProcess, ISequence, ITask } from "@synthesis/standard-metamodels/bpm/model"
import { dep1 } from "@synthesis/standard-metamodels/bpm/example-department"
import { IOrganization } from "@synthesis/standard-metamodels/bpm/organization"
import { ModelStore } from "../../index"
import { ExprNode } from "@synthesis/jsx-runtime"

// export const Approval_X_times_Par: (x: number) => ExprNode<IProcess> = (x) => {
export const Approval_X_times_Par = (x: number) => () => {
  let f: () => ExprNode<IProcess> = () => {
    let tasks = Array<string>() // create approval tasks names
    for (let i = 1; i <= x; i++) {
      tasks.push(`${i}`)
    }
    return (
      <Process name="Approval" store={new ModelStore()}>
        <Sequence>
          <Task name="write" />
          <Parallel>
            {
              tasks.map(t => <Task name={`approval ${t}`} />)
            }
          </Parallel>
        </Sequence>
      </Process>)
  }
  return f
}
/*
    export const Approval_X_Par: (x: number, isParallel: boolean) => STX.Template<IProcessProps, IProcess> =
    (x, isParallel) => {
        let f: STX.Template<IProcessProps, IProcess> = (props) => {
            let tasks = new Array<string>() // create approval tasks names
            for (let i = 1; i <= x; i++) {
                tasks.push(`approval ${i}`)
            }
            return (
                <Process name='Approval'>
                    <Sequence>
                        <Task name='write' />
                        {isParallel ?
                            <Parallel>
                                {tasks.map(t => <Task name={`approval ${t}`} />)}
                            </Parallel>
                            :
                            <Sequence>
                                {tasks.map(t => <Task name={`approval ${t}`} />)}
                            </Sequence>
                        }
                    </Sequence>
                </Process>)
        }
        return f
    }



    export const GenericApprovalHOC: (x: number, isParallel: boolean, WorkerTask: STX.Template<ITaskProps, ITask>)
    => STX.Template<IProcessProps, IProcess> =
    (x, isParallel, WorkerTask) => {
        let f: STX.Template<IProcessProps, IProcess> = (props) => {
            let tasks = new Array<string>() // create approval tasks names
            for (let i = 1; i <= x; i++) {
                tasks.push(`approval ${i}`)
            }
            return (
                <Sequence>
                    <WorkerTask {...props} />
                    {isParallel ?
                        <Parallel>
                            {tasks.map(t => <Task name={`approval ${t}`} />)}
                        </Parallel>
                        :
                        <Sequence>
                            {tasks.map(t => <Task name={`approval ${t}`} />)}
                        </Sequence>
                    }
                </Sequence>
            )
        }
        return f
    }

 */
/*
    const Approval_2_Seq_v2 = (Approval: STX.Template<IProcessProps, IProcess>) => {
        return <Process name='Approval'>
            {GenericApprovalHOC(2, false, <Task name="write" />)}
        </Process>
    }

    export const ApprovalConfig = t.object({
        xTimes: t.number,
        isParallel: t.boolean
    })

    type IApprovalConfig = t.TypeOf<typeof ApprovalConfig>

const appConfig1: IApprovalConfig = { xTimes: 3, isParallel: false }

const createApprovalConfig: (org: IOrganization) => IApprovalConfig =
    (org) => {
        return {
            xTimes: org.departments.length,
            isParallel: false
        }
    }

    
const Approval_Par_Config: (org: IOrganization) => IProcess =
(org) => {
    let {xTimes, isParallel} = createApprovalConfig(org)
    return <Process name='Approval'>
        {GenericApprovalHOC(xTimes, isParallel, <Task name="write" />)}
    </Process>
}

const Approval_Par_ConfigHOC: (WorkerTask: STX.Template<ITaskProps, ITask>) => (org: IOrganization) => IProcess =
(WorkerTask) => (org) => {
let {xTimes, isParallel} = createApprovalConfig(org)
return <Process name='Approval'>
    {GenericApprovalHOC(xTimes, isParallel, <WorkerTask name="write" />)}
</Process>
}

const Approval_Par_Write_ConfigHOC = Approval_Par_ConfigHOC(<Task name="write" />)


const Approval_Par_Write_Dept1 = Approval_Par_Write_ConfigHOC(dep1)
*/
describe("Dummy test", () => {
  it("works if true is truthy", () => {
    expect(true).toBeTruthy()
  })
})
