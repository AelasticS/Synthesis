/** @jsx createExprNode */
/**
 * The decision model: the design space of the transformation, declared
 * as data. Each issue names one open design question; each option is one
 * admissible answer, and isDefault marks the answer used when a
 * configuration does not choose explicitly. Option names correspond to
 * the @VarOption methods of the transformation class.
 */
import { createExprNode } from "@aelastics/synthesis/jsx-runtime";
import { DecisionModel, ElementIssue, ModelIssue, Option, SimpleOption, } from "@aelastics/synthesis/decision-framework/decisions/1.decision-model/decision-meta.model-components";
export const RelationSchemaDesignIssues = (store) => (createExprNode(DecisionModel, { name: "RelationSchemaDesign", description: "Design space for persistence strategies", store: store },
    createExprNode(ElementIssue, { name: "OneToManyStrategy", description: "How to implement 1:N relationships" },
        createExprNode(Option, { name: "ForeignKey", description: "Use Foreign Key in the Many side table", isDefault: false, optionType: createExprNode(SimpleOption, { name: "FK" }) }),
        createExprNode(Option, { name: "JoinTable", description: "Use a separate join table", isDefault: true, optionType: createExprNode(SimpleOption, { name: "JoinTableOption" }) })),
    createExprNode(ElementIssue, { name: "PrimaryKeyStrategy", description: "How to implement primary keys" },
        createExprNode(Option, { name: "UseAutoIncrement", description: "Database auto increment", isDefault: true, optionType: createExprNode(SimpleOption, { name: "PK_AutoInc" }) }),
        createExprNode(Option, { name: "UseManualIncrement", description: "Use manual increment", isDefault: false, optionType: createExprNode(SimpleOption, { name: "PK_ManInc" }) })),
    createExprNode(ModelIssue, { name: "NamingConvention", description: "How to name the database tables" },
        createExprNode(Option, { name: "CamelCase", description: "Use camelCase for table names", isDefault: false, optionType: createExprNode(SimpleOption, { name: "CamelCaseOption" }) }),
        createExprNode(Option, { name: "SnakeCase", description: "Use snake_case for table names", isDefault: true, optionType: createExprNode(SimpleOption, { name: "SnakeCaseOption" }) }))));
//# sourceMappingURL=decision-model.js.map