/** @jsx createExprNode */
/*
 * Copyright (c) AelasticS 2022.
 */

// const EER = getEER({} as IModel, null)

import { createExprNode } from "@synthesis/jsx-runtime";
import * as et from "@synthesis/standard-metamodels/eer/model";
import * as e from "@synthesis/standard-metamodels/eer";
import { ExprNode } from "@synthesis/jsx-runtime";

const eerSchema1: ExprNode<et.IEERSchema> = (
  <e.EERSchema name="Persons" MDA_level="M1">
    <e.Kernel name="Person">
      <e.Attribute name="PersonName">
        <e.Domain name="string" />
      </e.Attribute>
    </e.Kernel>
    <e.Weak id="11" name="Child">
      <e.Attribute  name="ChildID">
        <e.Domain name="number" />
      </e.Attribute>
      <e.Attribute name="ChildName">
        <e.Domain $refByName="string" />
      </e.Attribute>
    </e.Weak>
  </e.EERSchema>
);

export default function f() : ExprNode<et.IEERSchema> {
  return eerSchema1;
}
