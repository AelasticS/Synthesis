/** @jsx createExprNode */

/**
 * The decision model: the design space of the transformation, declared
 * as data. Each issue names one open design question; each option is one
 * admissible answer, and isDefault marks the answer used when a
 * configuration does not choose explicitly. Option names correspond to
 * the @VarOption methods of the transformation class.
 */
import { createExprNode } from "@aelastics/synthesis/jsx"
import { ExprNode } from "@aelastics/synthesis/jsx"
import { ModelStore } from "@aelastics/synthesis/store"
import {
  DecisionModel,
  ElementIssue,
  ModelIssue,
  Option,
  SimpleOption,
} from "@aelastics/synthesis/metamodels/decision"

import * as t from "@aelastics/synthesis/metamodels/decision/model"

export const RelationSchemaDesignIssues = (store: ModelStore): ExprNode<t.IDecisionModel> => (
  <DecisionModel
    name="RelationSchemaDesign"
    description="Design space for persistence strategies"
    store={store}
  >
    <ElementIssue name="OneToManyStrategy" description="How to implement 1:N relationships">
      <Option name="ForeignKey" description="Use a foreign key on the many side table" isDefault={false}
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
    <ElementIssue name="TableAuditing" description="Which tables carry audit columns">
      <Option name="AuditColumns" description="Append createdBy and createdAt to the table" isDefault={true}
              optionType={<SimpleOption name="AuditOn" />}
      />
      <Option name="NoAuditColumns" description="No audit columns on this table" isDefault={false}
              optionType={<SimpleOption name="AuditOff" />}
      />
    </ElementIssue>
    <ElementIssue name="InheritanceStrategy" description="How a specialization hierarchy maps to tables">
      <Option name="JoinedTables" description="One table per subtype, joined to the root by its key" isDefault={true}
              optionType={<SimpleOption name="InhJoined" />}
      />
      <Option name="SingleTable" description="One table for the whole hierarchy, with a discriminator" isDefault={false}
              optionType={<SimpleOption name="InhSingle" />}
      />
      <Option name="TablePerClass" description="One table per concrete entity, root columns copied" isDefault={false}
              optionType={<SimpleOption name="InhTpc" />}
      />
    </ElementIssue>
    <ModelIssue name="IndexOnForeignKey" description="Whether every foreign key gets an index">
      <Option name="IndexAllForeignKeys" description="One index per foreign key" isDefault={true}
              optionType={<SimpleOption name="IxAll" />}
      />
      <Option name="NoForeignKeyIndexes" description="No indexes are generated" isDefault={false}
              optionType={<SimpleOption name="IxNone" />}
      />
    </ModelIssue>
    <ModelIssue name="ForeignKeyColumnNaming" description="How foreign key and copied key columns are named">
      <Option name="ShortNames" description="Keep the referenced column's name; prefix only where it is the meaning" isDefault={true}
              optionType={<SimpleOption name="FkShort" />}
      />
      <Option name="TablePrefixed" description="Prefix the referenced table's name on every hop" isDefault={false}
              optionType={<SimpleOption name="FkPrefixed" />}
      />
    </ModelIssue>
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
