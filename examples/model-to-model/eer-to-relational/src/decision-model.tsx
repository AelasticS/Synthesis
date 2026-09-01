/** @jsx createExprNode */

/**
 * The decision model: the design space of the transformation, declared
 * as data. Each issue names one open design question; each option is one
 * admissible answer, and isDefault marks the answer used when a
 * configuration does not choose explicitly. Option names correspond to
 * the @VarOption methods of the transformation class.
 */
import { createExprNode } from "@aelastics/synthesis/jsx-runtime"
import { ExprNode, ModelStore } from "@aelastics/synthesis/engine"
import {
  DecisionModel,
  ElementIssue,
  ModelIssue,
  Option,
  SimpleOption,
} from "@aelastics/synthesis/decision-framework/decisions/1.decision-model/decision-meta.model-components"

import * as t from "@aelastics/synthesis/decision-framework/decisions/1.decision-model/decision-meta.model"

export const RelationSchemaDesignIssues = (store: ModelStore): ExprNode<t.IDecisionModel> => (
  <DecisionModel
    name="RelationSchemaDesign"
    description="Design space for persistence strategies"
    store={store}
  >
    <ElementIssue name="OneToManyStrategy" description="How to implement 1:N relationships">
      <Option name="ForeignKey" description="Use Foreign Key in the Many side table" isDefault={false}
              optionType={<SimpleOption name="FK" />}
      />
      <Option name="JoinTable" description="Use a separate join table" isDefault={true}
              optionType={<SimpleOption name="JoinTableOption" />}
      />
    </ElementIssue>
    <ElementIssue name="PrimaryKeyStrategy" description="How to implement primary keys">
      <Option name="UseAutoIncrement" description="Database auto increment" isDefault={true}
              optionType={<SimpleOption name="PK_AutoInc" />}
      />
      <Option name="UseManualIncrement" description="Use manual increment" isDefault={false}
              optionType={<SimpleOption name="PK_ManInc" />}
      />
    </ElementIssue>
    <ModelIssue name="NamingConvention" description="How to name the database tables">
      <Option name="CamelCase" description="Use camelCase for table names" isDefault={false}
              optionType={<SimpleOption name="CamelCaseOption" />}
      />
      <Option name="SnakeCase" description="Use snake_case for table names" isDefault={true}
              optionType={<SimpleOption name="SnakeCaseOption" />}
      />
    </ModelIssue>
  </DecisionModel>
)
