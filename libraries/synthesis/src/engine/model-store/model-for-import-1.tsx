/** @jsx createExprNode */
/*
 * Copyright (c) AelasticS 2022.
 */

import { createExprNode } from "../../jsx-runtime";
import * as bt from "../test/bpm-metamodel/BPM.meta.model.type";
import * as b from "../test/bpm-metamodel";
import { ExprNode } from "../../jsx-runtime";

// A Process is a model (and thus a namespace), so importNamespace accepts it.
const processModel: ExprNode<bt.IProcess> = (
  <b.Process name="Approval">
    <b.Sequence name="seq1">
      <b.Task name="write" />
      <b.Task name="approve" />
    </b.Sequence>
    <b.Role name="admin" />
  </b.Process>
);

export default function f(): ExprNode<bt.IProcess> {
  return processModel;
}
