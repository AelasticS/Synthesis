/** @jsx createExprNode */

import { createExprNode } from "@aelastics/synthesis/jsx"
import { ExprNode } from "@aelastics/synthesis/jsx"
import { ModelStore } from "@aelastics/synthesis/store"
import {
  DecisionModel,
  GlobalIssue,
  Option,
  SimpleOption,
} from "@aelastics/synthesis/metamodels/decision"

import * as t from "@aelastics/synthesis/metamodels/decision/model"

/**
 * Design space of the Rel->DDL text generation. One global (model-wide)
 * issue: how SQL identifiers are emitted. `Unquoted` is the default and
 * matches the historical output of the transformation; `DoubleQuoted`
 * wraps every table/column identifier in double quotes.
 */
export const DdlGenerationIssues = (store: ModelStore): ExprNode<t.IDecisionModel> => (
  <DecisionModel
    name="DdlGenerationDesign"
    description="Design space for SQL DDL generation"
    store={store}
  >
    <GlobalIssue name="IdentifierQuoting" description="How to emit SQL identifiers in the generated DDL">
      <Option name="Unquoted" description="Emit identifiers verbatim" isDefault={true}
              optionType={<SimpleOption name="UnquotedOption" />}
      />
      <Option name="DoubleQuoted" description="Wrap identifiers in double quotes" isDefault={false}
              optionType={<SimpleOption name="DoubleQuotedOption" />}
      />
    </GlobalIssue>
  </DecisionModel>
)
