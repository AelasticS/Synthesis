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
import { createExprNode } from '@aelastics/synthesis/jsx-runtime';
import { DecisionModel, GlobalIssue, Option, SimpleOption } from '@aelastics/synthesis/decision-framework/decisions/1.decision-model/decision-meta.model-components';
export const SqlGenerationIssues = (store) => (createExprNode(DecisionModel, { name: "SqlGenerationDesign", description: "Design space for generating SQL DDL from a relational schema", store: store },
    createExprNode(GlobalIssue, { name: "OutputLayout", description: "How the generated DDL is laid out over files" },
        createExprNode(Option, { name: "SingleFile", description: "One file with every CREATE TABLE and inline REFERENCES clauses", isDefault: false, optionType: createExprNode(SimpleOption, { name: "SingleFileOption" }) }),
        createExprNode(Option, { name: "TablesAndConstraints", description: "One file of CREATE TABLE statements and one of ALTER TABLE foreign keys", isDefault: true, optionType: createExprNode(SimpleOption, { name: "TablesAndConstraintsOption" }) }),
        createExprNode(Option, { name: "FilePerTable", description: "One file per table, plus one file of ALTER TABLE foreign keys", isDefault: false, optionType: createExprNode(SimpleOption, { name: "FilePerTableOption" }) })),
    createExprNode(GlobalIssue, { name: "IdentifierQuoting", description: "How to emit SQL identifiers in the generated DDL" },
        createExprNode(Option, { name: "Unquoted", description: "Emit identifiers verbatim", isDefault: true, optionType: createExprNode(SimpleOption, { name: "UnquotedOption" }) }),
        createExprNode(Option, { name: "DoubleQuoted", description: "Wrap identifiers in double quotes", isDefault: false, optionType: createExprNode(SimpleOption, { name: "DoubleQuotedOption" }) }))));
//# sourceMappingURL=decision-model.js.map