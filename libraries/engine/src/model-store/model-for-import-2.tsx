/** @jsx createExprNode */
/*
 * Copyright (c) AelasticS 2022.
 */

// const EER = getEER({} as IModel, null)

import { createExprNode } from '../index';
import * as et from "@synthesis/standard-metamodels/eer/model";
import * as e from "@synthesis/standard-metamodels/eer";
import { ExprNode } from '../index'

const eerSchema1 = (
    <e.Kernel name="Person">
      <e.Attribute name="PersonName">
        <e.Domain name="string" />
      </e.Attribute>
    </e.Kernel>

);

export default function f()  {
  return eerSchema1;
}
