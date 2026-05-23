/** @jsx createExprNode */
/*
 * Copyright (c) AelasticS 2022.
 */

import { createExprNode } from "@synthesis/jsx-runtime"
import { Context } from "@synthesis/jsx-runtime";
import { ExprNode } from "@synthesis/jsx-runtime";
import { ModelStore } from '../../index'
import { Process, Sequence, Task, Document, OutputDocument, InputDocument, Role } from '@synthesis/standard-metamodels/bpm'
import { IProcess, ISequence } from '@synthesis/standard-metamodels/bpm/model'

describe("Dummy test", () => {
  it("works if true is truthy", () => {
    expect(true).toBeTruthy()
  })})

describe('test create function', () => {

  it('should create direct Sequence tag', () => {
    let e: ExprNode<IProcess> = <Process name='Approval' store={new ModelStore()}>
      <Sequence name='seq1'>
        <Task name='write' />
        <Task name='approve' />
      </Sequence>
    </Process>

    let p: IProcess = e.render(new Context())
    let a: ISequence = p.elements[0] as ISequence
    expect(a).toHaveProperty("name", "seq1");
    expect(a.children.length).toEqual(2)
    //   let [first, second] = a.children
    //   expect(first).toEqual(expect.objectContaining({ name: "write" }))
    expect(a.children).toEqual(expect.arrayContaining([
      expect.objectContaining({ name: "write", parent: a }),
      expect.objectContaining({ name: "approve", parent: a })]))
  });

  it('reveals: Role inside Sequence via non-existent "roles" property is silently dropped', () => {
    let e: ExprNode<IProcess> = <Process name='Approval2' store={new ModelStore()}>
      <Sequence name='seq2'>
        <Role name='admin' />
      </Sequence>
    </Process>

    let p: IProcess = e.render(new Context())
    let seq: ISequence = p.elements[0] as ISequence

    expect(seq).toHaveProperty("name", "seq2");
    // Sequence has no "roles" property in the type schema
    expect((seq as any).roles).toBeUndefined()
    // The Role wasn't connected via children either (children is for Node subtypes only,
    // but Role doesn't extend Node — yet the JSX child connector uses propName "roles" anyway)
    expect(seq.children.length).toEqual(0)
  });

});


describe('test create function with references', () => {

  it('should connect using references by name', () => {
    let e: ExprNode<IProcess> = <Process name='Approval3' store={new ModelStore()}>
      <Sequence name='seq3'>
        <Document name='Proposal' />
        <Document name='FinalResult' />
        <Task name='write'>
          <OutputDocument $refByName='Proposal' />
        </Task>
        <Task name='approve' >
          <InputDocument $refByName='Proposal' />
          <OutputDocument $refByName='FinalResult' />
        </Task>
      </Sequence>
    </Process>

    let p: IProcess = e.render(new Context())
    let a: ISequence = p.elements[0] as ISequence
    expect(a).toHaveProperty("name", "seq3");
    expect(a.children.length).toEqual(4)
    expect(a.children).toEqual(expect.arrayContaining(
      [expect.objectContaining(
        {
          name: "write", parent: a,
          outputs: expect.arrayContaining([expect.objectContaining({ name: 'Proposal' })])
        }),
      expect.objectContaining(
        {
          name: "approve", parent: a,
          inputs: expect.arrayContaining([expect.objectContaining({ name: 'Proposal' })]),
          outputs: expect.arrayContaining([expect.objectContaining({ name: 'FinalResult' })])
        })
      ])
    )
  })
})
