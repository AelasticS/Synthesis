/** @jsx createExprNode */

/**
 * The decision model: the design space of the transformation, declared
 * as data. This package leaves exactly one question open, so there is
 * exactly one issue. It is an ElementIssue, which means it is answered
 * once per source element rather than once per model: two 1:N
 * relationships in the same schema may be implemented differently.
 *
 * Option names correspond to the @VarOption methods of the
 * transformation class, and isDefault marks the answer used when a
 * configuration does not choose explicitly. It has to agree with the
 * @Default() decorator in transformation.tsx.
 */
import { createExprNode } from '@synthesis/jsx-runtime'
import type { ExprNode, ModelStore } from '@synthesis/engine'
import {
  DecisionModel,
  ElementIssue,
  Option,
  SimpleOption,
} from '@synthesis/decision-framework/decisions/1.decision-model/decision-meta.model-components'
import type * as t from '@synthesis/decision-framework/decisions/1.decision-model/decision-meta.model'

export const RelationshipDesignIssues = (store: ModelStore): ExprNode<t.IDecisionModel> => (
  <DecisionModel
    name="RelationshipDesign"
    description="Design space for implementing EER relationships in a relational schema"
    store={store}
  >
    <ElementIssue
      name="OneToManyStrategy"
      description="How to implement a 1:N relationship"
    >
      <Option
        name="ForeignKey"
        description="Put a foreign key column on the N side table"
        isDefault={true}
        optionType={<SimpleOption name="FK" />}
      />
      <Option
        name="JoinTable"
        description="Give the relationship a table of its own"
        isDefault={false}
        optionType={<SimpleOption name="JT" />}
      />
    </ElementIssue>
  </DecisionModel>
)
