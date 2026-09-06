/** @jsx createExprNode */
import { createExprNode } from "@aelastics/synthesis/jsx";
import { DecisionModel, ElementIssue, GlobalIssue, Option, SimpleOption, } from "@aelastics/synthesis/metamodels/decision";
/**
 * Design space of the Rel to DDL text generation. Global issues: how
 * SQL identifiers are emitted, how referential rules reach the DDL
 * (native action clauses or trigger emulation), how domains are
 * rendered (CREATE DOMAIN or inlined base types with checks), and
 * which SQL dialect flavors the physical emissions. One per-table
 * issue: whether the table is physically clustered by its primary
 * key. A dialect is not code anywhere here: the shipped presets are
 * configuration models closing these issues (see presets/).
 */
export const DdlGenerationIssues = (store) => (createExprNode(DecisionModel, { name: "DdlGenerationDesign", description: "Design space for SQL DDL generation", store: store },
    createExprNode(GlobalIssue, { name: "IdentifierQuoting", description: "How to emit SQL identifiers in the generated DDL" },
        createExprNode(Option, { name: "Unquoted", description: "Emit identifiers verbatim", isDefault: true, optionType: createExprNode(SimpleOption, { name: "UnquotedOption" }) }),
        createExprNode(Option, { name: "DoubleQuoted", description: "Wrap identifiers in double quotes", isDefault: false, optionType: createExprNode(SimpleOption, { name: "DoubleQuotedOption" }) })),
    createExprNode(GlobalIssue, { name: "ReferentialActions", description: "How integrity rules reach the DDL" },
        createExprNode(Option, { name: "NativeDdl", description: "Disconnect rules as ON DELETE and ON UPDATE clauses; connect rules other than Restrict as triggers", isDefault: true, optionType: createExprNode(SimpleOption, { name: "NativeDdlOption" }) }),
        createExprNode(Option, { name: "TriggerEmulation", description: "Every non-Restrict rule as a trigger, for dialects without declarative actions", isDefault: false, optionType: createExprNode(SimpleOption, { name: "TriggerEmulationOption" }) })),
    createExprNode(GlobalIssue, { name: "DomainHandling", description: "How wired domains are rendered" },
        createExprNode(Option, { name: "InlineTypes", description: "Base types inline, with per-column DEFAULT and CHECK", isDefault: true, optionType: createExprNode(SimpleOption, { name: "InlineTypesOption" }) }),
        createExprNode(Option, { name: "EmitDomains", description: "CREATE DOMAIN statements; columns reference the domain by name", isDefault: false, optionType: createExprNode(SimpleOption, { name: "EmitDomainsOption" }) })),
    createExprNode(GlobalIssue, { name: "SqlDialect", description: "The dialect flavoring the physical emissions" },
        createExprNode(Option, { name: "StandardSql", description: "Portable SQL, no dialect-specific physical statements", isDefault: true, optionType: createExprNode(SimpleOption, { name: "StandardSqlOption" }) }),
        createExprNode(Option, { name: "PostgreSql", description: "PostgreSQL: one-time CLUSTER statements for clustered tables", isDefault: false, optionType: createExprNode(SimpleOption, { name: "PostgreSqlOption" }) }),
        createExprNode(Option, { name: "Oracle", description: "Oracle: index-organized tables for clustered tables", isDefault: false, optionType: createExprNode(SimpleOption, { name: "OracleOption" }) })),
    createExprNode(ElementIssue, { name: "Clustering", description: "Whether this table is physically clustered by its primary key" },
        createExprNode(Option, { name: "None", description: "No physical clustering", isDefault: true, optionType: createExprNode(SimpleOption, { name: "NoClusteringOption" }) }),
        createExprNode(Option, { name: "ClusterPrimaryKey", description: "Cluster the table by its primary key (dialect decides the emission)", isDefault: false, optionType: createExprNode(SimpleOption, { name: "ClusterPrimaryKeyOption" }) }))));
//# sourceMappingURL=decision-model.js.map