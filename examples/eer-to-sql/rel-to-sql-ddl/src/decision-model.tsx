/** @jsx createExprNode */

import { createExprNode } from "@aelastics/synthesis/jsx"
import { ExprNode } from "@aelastics/synthesis/jsx"
import { ModelStore } from "@aelastics/synthesis/store"
import {
  DecisionModel,
  ElementIssue,
  GlobalIssue,
  Option,
} from "@aelastics/synthesis/metamodels/decision"

import * as t from "@aelastics/synthesis/metamodels/decision/model"

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
export const DdlGenerationIssues = (store: ModelStore): ExprNode<t.IDecisionModel> => (
  <DecisionModel
    name="DdlGenerationDesign"
    description="Design space for SQL DDL generation"
    store={store}
  >
    <GlobalIssue name="IdentifierQuoting" description="How to emit SQL identifiers in the generated DDL">
      <Option name="Unquoted" description="Emit identifiers verbatim" isDefault={true}/>
      <Option name="DoubleQuoted" description="Wrap identifiers in double quotes" isDefault={false}/>
    </GlobalIssue>
    <GlobalIssue name="ReferentialActions" description="How integrity rules reach the DDL">
      <Option name="NativeDdl" description="Disconnect rules as ON DELETE and ON UPDATE clauses; connect rules other than Restrict as triggers" isDefault={true}/>
      <Option name="TriggerEmulation" description="Every non-Restrict rule as a trigger, for dialects without declarative actions" isDefault={false}/>
    </GlobalIssue>
    <GlobalIssue name="DomainHandling" description="How wired domains are rendered">
      <Option name="InlineTypes" description="Base types inline, with per-column DEFAULT and CHECK" isDefault={true}/>
      <Option name="EmitDomains" description="CREATE DOMAIN statements; columns reference the domain by name" isDefault={false}/>
    </GlobalIssue>
    <GlobalIssue name="SqlDialect" description="The dialect flavoring the physical emissions">
      <Option name="StandardSql" description="Portable SQL, no dialect-specific physical statements" isDefault={true}/>
      <Option name="PostgreSql" description="PostgreSQL: one-time CLUSTER statements for clustered tables" isDefault={false}/>
      <Option name="Oracle" description="Oracle: index-organized tables for clustered tables" isDefault={false}/>
    </GlobalIssue>
    <ElementIssue name="Clustering" description="Whether this table is physically clustered by its primary key">
      <Option name="None" description="No physical clustering" isDefault={true}/>
      <Option name="ClusterPrimaryKey" description="Cluster the table by its primary key (dialect decides the emission)" isDefault={false}/>
    </ElementIssue>
  </DecisionModel>
)
