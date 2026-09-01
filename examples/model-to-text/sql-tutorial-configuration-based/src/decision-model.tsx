/** @jsx createExprNode */

/**
 * The design space of the SQL generation, declared as data. Both issues
 * are global: they are answered once for a whole run, not once per table
 * or per column, so a configuration model holds exactly two choices no
 * matter how large the schema is.
 *
 * Option names correspond to the @VarOption methods of the
 * transformation, and isDefault marks the answer used when a
 * configuration does not choose explicitly. It has to agree with the
 * @Default() decorators in transformation.tsx.
 */
import { createExprNode } from '@aelastics/synthesis/jsx-runtime'
import type { ExprNode, ModelStore } from '@aelastics/synthesis/engine'
import {
  DecisionModel,
  GlobalIssue,
  Option,
  SimpleOption
} from '@aelastics/synthesis/decision-framework/decisions/1.decision-model/decision-meta.model-components'
import type * as t from '@aelastics/synthesis/decision-framework/decisions/1.decision-model/decision-meta.model'

export const SqlGenerationIssues = (store: ModelStore): ExprNode<t.IDecisionModel> => (
  <DecisionModel
    name="SqlGenerationDesign"
    description="Design space for generating SQL DDL from a relational schema"
    store={store}
  >
    {/* How many files the schema becomes, and what goes in each. The
        three options are the three shapes a deployable script can take,
        and no property of the schema decides between them. */}
    <GlobalIssue name="OutputLayout" description="How the generated DDL is laid out over files">
      <Option
        name="SingleFile"
        description="One file with every CREATE TABLE and inline REFERENCES clauses"
        isDefault={false}
        optionType={<SimpleOption name="SingleFileOption" />}
      />
      <Option
        name="TablesAndConstraints"
        description="One file of CREATE TABLE statements and one of ALTER TABLE foreign keys"
        isDefault={true}
        optionType={<SimpleOption name="TablesAndConstraintsOption" />}
      />
      <Option
        name="FilePerTable"
        description="One file per table, plus one file of ALTER TABLE foreign keys"
        isDefault={false}
        optionType={<SimpleOption name="FilePerTableOption" />}
      />
    </GlobalIssue>

    {/* The same issue rel-to-sql-ddl carries: quoting is a house style,
        not something the schema can answer. */}
    <GlobalIssue name="IdentifierQuoting" description="How to emit SQL identifiers in the generated DDL">
      <Option
        name="Unquoted"
        description="Emit identifiers verbatim"
        isDefault={true}
        optionType={<SimpleOption name="UnquotedOption" />}
      />
      <Option
        name="DoubleQuoted"
        description="Wrap identifiers in double quotes"
        isDefault={false}
        optionType={<SimpleOption name="DoubleQuotedOption" />}
      />
    </GlobalIssue>
  </DecisionModel>
)
