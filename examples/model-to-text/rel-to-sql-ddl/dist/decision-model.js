/** @jsx createExprNode */
import { createExprNode } from "@synthesis/jsx-runtime";
import { DecisionModel, GlobalIssue, Option, SimpleOption, } from "@synthesis/decision-framework/decisions/1.decision-model/decision-meta.model-components";
/**
 * Design space of the Rel to DDL text generation. One global (model-wide)
 * issue: how SQL identifiers are emitted. `Unquoted` is the default and
 * matches the historical output of the transformation; `DoubleQuoted`
 * wraps every table and column identifier in double quotes.
 */
export const DdlGenerationIssues = (store) => (createExprNode(DecisionModel, { name: "DdlGenerationDesign", description: "Design space for SQL DDL generation", store: store },
    createExprNode(GlobalIssue, { name: "IdentifierQuoting", description: "How to emit SQL identifiers in the generated DDL" },
        createExprNode(Option, { name: "Unquoted", description: "Emit identifiers verbatim", isDefault: true, optionType: createExprNode(SimpleOption, { name: "UnquotedOption" }) }),
        createExprNode(Option, { name: "DoubleQuoted", description: "Wrap identifiers in double quotes", isDefault: false, optionType: createExprNode(SimpleOption, { name: "DoubleQuotedOption" }) }))));
//# sourceMappingURL=decision-model.js.map