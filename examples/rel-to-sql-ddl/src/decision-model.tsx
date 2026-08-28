/** @jsx createExprNode */

import { createExprNode } from "@synthesis/jsx-runtime"
import { ExprNode, ModelStore } from "@synthesis/engine"
import {
  DecisionModel,
  GlobalIssue,
  Option,
  SimpleOption,
} from "@synthesis/decision-framework/decisions/1.decision-model/decision-meta.model-components"

import * as t from "@synthesis/decision-framework/decisions/1.decision-model/decision-meta.model"

/**
 * Design space of the Rel to DDL text generation. One global (model-wide)
 * issue: how SQL identifiers are emitted. `Unquoted` is the default and
 * matches the historical output of the transformation; `DoubleQuoted`
 * wraps every table and column identifier in double quotes.
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
