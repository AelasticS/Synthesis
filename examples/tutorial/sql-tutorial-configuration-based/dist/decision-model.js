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
import { createExprNode } from '@aelastics/synthesis/jsx';
import { DecisionModel, ModelLevelIssue, Option } from '@aelastics/synthesis/metamodels/decision';
export const SqlGenerationIssues = (store) => (createExprNode(DecisionModel, { name: "SqlGenerationDesign", description: "Design space for generating SQL DDL from a relational schema", store: store },
    createExprNode(ModelLevelIssue, { name: "OutputLayout", description: "How the generated DDL is laid out over files" },
        createExprNode(Option, { name: "SingleFile", description: "One file with every CREATE TABLE and inline REFERENCES clauses", isDefault: false }),
        createExprNode(Option, { name: "TablesAndConstraints", description: "One file of CREATE TABLE statements and one of ALTER TABLE foreign keys", isDefault: true }),
        createExprNode(Option, { name: "FilePerTable", description: "One file per table, plus one file of ALTER TABLE foreign keys", isDefault: false })),
    createExprNode(ModelLevelIssue, { name: "IdentifierQuoting", description: "How to emit SQL identifiers in the generated DDL" },
        createExprNode(Option, { name: "Unquoted", description: "Emit identifiers verbatim", isDefault: true }),
        createExprNode(Option, { name: "DoubleQuoted", description: "Wrap identifiers in double quotes", isDefault: false }))));
//# sourceMappingURL=decision-model.js.map