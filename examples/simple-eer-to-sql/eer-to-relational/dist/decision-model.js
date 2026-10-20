/** @jsx createExprNode */
/**
 * The decision model: the design space of the transformation, declared
 * as data. Each issue names one open design question; each option is one
 * admissible answer, and isDefault marks the answer used when a
 * configuration does not choose explicitly. Option names correspond to
 * the @VarOption methods of the transformation class.
 */
import { createExprNode } from "@aelastics/synthesis/jsx";
import { DecisionModel, ElementLevelIssue, ModelLevelIssue, Option } from "@aelastics/synthesis/metamodels/decision";
export const RelationSchemaDesignIssues = (store) => (createExprNode(DecisionModel, { name: "RelationSchemaDesign", description: "Design space for persistence strategies", store: store },
    createExprNode(ElementLevelIssue, { name: "OneToManyStrategy", description: "How to implement 1:N relationships" },
        createExprNode(Option, { name: "ForeignKey", description: "Use a foreign key on the many side table", isDefault: false }),
        createExprNode(Option, { name: "JoinTable", description: "Use a separate join table", isDefault: true })),
    createExprNode(ElementLevelIssue, { name: "PrimaryKeyStrategy", description: "How to implement primary keys" },
        createExprNode(Option, { name: "UseAutoIncrement", description: "Database auto increment", isDefault: true }),
        createExprNode(Option, { name: "UseManualIncrement", description: "Use manual increment", isDefault: false })),
    createExprNode(ModelLevelIssue, { name: "NamingConvention", description: "How to name the database tables" },
        createExprNode(Option, { name: "CamelCase", description: "Use camelCase for table names", isDefault: false }),
        createExprNode(Option, { name: "SnakeCase", description: "Use snake_case for table names", isDefault: true }))));
//# sourceMappingURL=decision-model.js.map