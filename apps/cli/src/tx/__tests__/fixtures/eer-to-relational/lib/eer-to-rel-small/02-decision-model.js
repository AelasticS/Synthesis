/** @jsx createExprNode */
import * as jsx_1 from "@aelastics/synthesis/jsx";
import * as decision_1 from "@aelastics/synthesis/metamodels/decision";
const RelationSchemaDesignIssues = (store) => ((0, jsx_1.createExprNode)(decision_1.DecisionModel, { name: "RelationSchemaDesign", description: "Design space for persistence strategies", store: store },
    (0, jsx_1.createExprNode)(decision_1.ElementLevelIssue, { name: "OneToManyStrategy", description: "How to implement 1:N relationships" },
        (0, jsx_1.createExprNode)(decision_1.Option, { name: "ForeignKey", description: "Use Foreign Key in the Many side table", isDefault: false }),
        (0, jsx_1.createExprNode)(decision_1.Option, { name: "JoinTable", description: "Use a separate join table", isDefault: true })),
    (0, jsx_1.createExprNode)(decision_1.ElementLevelIssue, { name: "PrimaryKeyStrategy", description: "How to implement primary keys" },
        (0, jsx_1.createExprNode)(decision_1.Option, { name: "UseAutoIncrement", description: "Database auto increment", isDefault: true }),
        (0, jsx_1.createExprNode)(decision_1.Option, { name: "UseManualIncrement", description: "Use manual increment", isDefault: false })),
    (0, jsx_1.createExprNode)(decision_1.ModelLevelIssue, { name: "NamingConvention", description: "How to name the database tables" },
        (0, jsx_1.createExprNode)(decision_1.Option, { name: "CamelCase", description: "Use camelCase for table names", isDefault: false }),
        (0, jsx_1.createExprNode)(decision_1.Option, { name: "SnakeCase", description: "Use snake_case for table names", isDefault: true }))));
export { RelationSchemaDesignIssues };
