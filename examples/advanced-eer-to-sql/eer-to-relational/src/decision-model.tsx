/** @jsx createExprNode */

/**
 * The decision model: the design space of the transformation, declared
 * as data. Each issue names one open design question; each option is one
 * admissible answer, and isDefault marks the answer used when a
 * configuration does not choose explicitly. Option names correspond to
 * the @VarOption methods of the transformation class.
 */
import {createExprNode} from "@aelastics/synthesis/jsx"
import {ExprNode} from "@aelastics/synthesis/jsx"
import {ModelStore} from "@aelastics/synthesis/store"
import {
    OpeningOption,
    DecisionModel,
    ElementIssue,
    ElementSubIssue,
    ModelIssue,
    Option
} from "@aelastics/synthesis/metamodels/decision"

import * as t from "@aelastics/synthesis/metamodels/decision/model"

export const RelationSchemaDesignIssues = (store: ModelStore): ExprNode<t.IDecisionModel> => (
    <DecisionModel
        name="RelationSchemaDesign"
        description="Design space for persistence strategies"
        store={store}
    >
        <ElementIssue name="OneToManyStrategy" description="How to implement 1:N relationships">
            <Option name="ForeignKey" description="Use a foreign key on the many side table" isDefault={false}/>
            <Option name="JoinTable" description="Use a separate join table" isDefault={true}
            />
        </ElementIssue>
        <ElementIssue name="PrimaryKeyStrategy" description="How to implement primary keys">
            <Option name="UseAutoIncrement" description="Database auto increment" isDefault={true}/>
            <Option name="UseManualIncrement" description="Use manual increment" isDefault={false}/>
        </ElementIssue>
        <ElementIssue name="TableAuditing" description="Which tables carry audit columns">
            <Option name="AuditColumns" description="Append createdBy and createdAt to the table" isDefault={true}/>
            <Option name="NoAuditColumns" description="No audit columns on this table" isDefault={false}/>
        </ElementIssue>
        <ElementIssue name="RowHistory" description="Whether this table keeps row history">
            <Option name="NoHistory" description="Current rows only" isDefault={true}/>
            {/* the composite option: choosing it opens the sub-issue below;
          the nesting is design-space structure only, configurations
          stay flat choice lists (see the variability guide) */}
            <OpeningOption name="HistoryTable" description="A separate history table records row versions"
                           isDefault={false}>
                <ElementSubIssue name="HistoryDiscriminator" description="What distinguishes row versions">
                    <Option name="ValidFromTimestamp" description="A validity timestamp" isDefault={true}/>
                    <Option name="VersionCounter" description="A monotonic version number" isDefault={false}/>
                </ElementSubIssue>
            </OpeningOption>
        </ElementIssue>
        <ElementIssue name="InheritanceStrategy" description="How a specialization hierarchy maps to tables">
            <Option name="JoinedTables" description="One table per subtype, joined to the root by its key"
                    isDefault={true}
            />
            <Option name="SingleTable" description="One table for the whole hierarchy, with a discriminator"
                    isDefault={false}/>
            <Option name="TablePerClass" description="One table per concrete entity, root columns copied"
                    isDefault={false}/>
        </ElementIssue>
        <ModelIssue name="IndexOnForeignKey" description="Whether every foreign key gets an index">
            <Option name="IndexAllForeignKeys" description="One index per foreign key" isDefault={true}/>
            <Option name="NoForeignKeyIndexes" description="No indexes are generated" isDefault={false}/>
        </ModelIssue>
        <ModelIssue name="ForeignKeyColumnNaming" description="How foreign key and copied key columns are named">
            <Option name="ShortNames"
                    description="Keep the referenced column's name; prefix only where it is the meaning"
                    isDefault={true}/>
            <Option name="TablePrefixed" description="Prefix the referenced table's name on every hop"
                    isDefault={false}/>
        </ModelIssue>
        <ModelIssue name="NamingConvention" description="How to name the database tables">
            <Option name="CamelCase" description="Use camelCase for table names" isDefault={false}/>
            <Option name="SnakeCase" description="Use snake_case for table names" isDefault={true}/>
        </ModelIssue>
    </DecisionModel>
)
