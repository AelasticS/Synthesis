/** @jsx createExprNode */
import * as jsx_1 from "@aelastics/synthesis/jsx";
import * as decision_1 from "@aelastics/synthesis/metamodels/decision";
/**
 * Design space of the Rel->DDL text generation. One global (model-wide)
 * issue: how SQL identifiers are emitted. `Unquoted` is the default and
 * matches the historical output of the transformation; `DoubleQuoted`
 * wraps every table/column identifier in double quotes.
 */
const DdlGenerationIssues = (store) => ((0, jsx_1.createExprNode)(decision_1.DecisionModel, { name: "DdlGenerationDesign", description: "Design space for SQL DDL generation", store: store },
    (0, jsx_1.createExprNode)(decision_1.GlobalIssue, { name: "IdentifierQuoting", description: "How to emit SQL identifiers in the generated DDL" },
        (0, jsx_1.createExprNode)(decision_1.Option, { name: "Unquoted", description: "Emit identifiers verbatim", isDefault: true, optionType: (0, jsx_1.createExprNode)(decision_1.SimpleOption, { name: "UnquotedOption" }) }),
        (0, jsx_1.createExprNode)(decision_1.Option, { name: "DoubleQuoted", description: "Wrap identifiers in double quotes", isDefault: false, optionType: (0, jsx_1.createExprNode)(decision_1.SimpleOption, { name: "DoubleQuotedOption" }) }))));
export { DdlGenerationIssues };