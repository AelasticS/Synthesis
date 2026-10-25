/** @jsx createExprNode */
/**
 * The decision model: the design space of the transformation, declared
 * as data. Each issue names one open design question; each option is one
 * admissible answer, and isDefault marks the answer used when a
 * configuration does not choose explicitly. Option names correspond to
 * the @VarOption methods of the transformation class.
 */
import { createExprNode } from "@aelastics/synthesis/jsx";
import { OpeningOption, DecisionModel, ElementLevelIssue, ElementLevelSubIssue, ModelLevelIssue, Option } from "@aelastics/synthesis/metamodels/decision";
export const RelationSchemaDesignIssues = (store) => (createExprNode(DecisionModel, { name: "RelationSchemaDesign", description: "Design space for persistence strategies", store: store },
    createExprNode(ElementLevelIssue, { name: "OneToManyStrategy", description: "How to implement 1:N relationships" },
        createExprNode(Option, { name: "ForeignKey", description: "Use a foreign key on the many side table", isDefault: false }),
        createExprNode(Option, { name: "JoinTable", description: "Use a separate join table", isDefault: true })),
    createExprNode(ElementLevelIssue, { name: "PrimaryKeyStrategy", description: "How to implement primary keys" },
        createExprNode(Option, { name: "UseAutoIncrement", description: "Database auto increment", isDefault: true }),
        createExprNode(Option, { name: "UseManualIncrement", description: "Use manual increment", isDefault: false })),
    createExprNode(ElementLevelIssue, { name: "TableAuditing", description: "Which tables carry audit columns" },
        createExprNode(Option, { name: "AuditColumns", description: "Append createdBy and createdAt to the table", isDefault: true }),
        createExprNode(Option, { name: "NoAuditColumns", description: "No audit columns on this table", isDefault: false })),
    createExprNode(ElementLevelIssue, { name: "RowHistory", description: "Whether this table keeps row history" },
        createExprNode(Option, { name: "NoHistory", description: "Current rows only", isDefault: true }),
        createExprNode(OpeningOption, { name: "HistoryTable", description: "A separate history table records row versions", isDefault: false },
            createExprNode(ElementLevelSubIssue, { name: "HistoryDiscriminator", description: "What distinguishes row versions" },
                createExprNode(Option, { name: "ValidFromTimestamp", description: "A validity timestamp", isDefault: true }),
                createExprNode(Option, { name: "VersionCounter", description: "A monotonic version number", isDefault: false })))),
    createExprNode(ElementLevelIssue, { name: "InheritanceStrategy", description: "How a specialization hierarchy maps to tables" },
        createExprNode(Option, { name: "JoinedTables", description: "One table per subtype, joined to the root by its key", isDefault: true }),
        createExprNode(Option, { name: "SingleTable", description: "One table for the whole hierarchy, with a discriminator", isDefault: false }),
        createExprNode(Option, { name: "TablePerClass", description: "One table per concrete entity, root columns copied", isDefault: false })),
    createExprNode(ModelLevelIssue, { name: "IndexOnForeignKey", description: "Whether every foreign key gets an index" },
        createExprNode(Option, { name: "IndexAllForeignKeys", description: "One index per foreign key", isDefault: true }),
        createExprNode(Option, { name: "NoForeignKeyIndexes", description: "No indexes are generated", isDefault: false })),
    createExprNode(ModelLevelIssue, { name: "ForeignKeyColumnNaming", description: "How foreign key and copied key columns are named" },
        createExprNode(Option, { name: "ShortNames", description: "Keep the referenced column's name; prefix only where it is the meaning", isDefault: true }),
        createExprNode(Option, { name: "TablePrefixed", description: "Prefix the referenced table's name on every hop", isDefault: false })),
    createExprNode(ModelLevelIssue, { name: "NamingConvention", description: "How to name the database tables" },
        createExprNode(Option, { name: "CamelCase", description: "Use camelCase for table names", isDefault: false }),
        createExprNode(Option, { name: "SnakeCase", description: "Use snake_case for table names", isDefault: true }))));
//# sourceMappingURL=decision-model.js.map