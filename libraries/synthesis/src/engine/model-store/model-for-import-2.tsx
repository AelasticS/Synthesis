/** @jsx createExprNode */
/*
 * Copyright (c) AelasticS 2022.
 */

import { createExprNode } from '../index';
import * as bt from "../test/bpm-metamodel/BPM.meta.model.type";
import * as b from "../test/bpm-metamodel";
import { ExprNode } from '../index'

// A Task is a plain model element, not a model or namespace, so
// ModelStore.importNamespace must reject this file.
const taskElement: ExprNode<bt.ITask> = (
  <b.Task name="write">
    <b.OutputDocument name="draft" />
  </b.Task>
);

export default function f() {
  return taskElement;
}
