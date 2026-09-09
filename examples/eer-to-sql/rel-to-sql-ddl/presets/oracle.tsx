/** @jsx createExprNode */

/*
 * The Oracle preset EXTENDS standard-sql: classic Oracle has no ON
 * UPDATE actions and no CREATE DOMAIN (domains arrived in 23ai), so
 * the referential rules move to trigger emulation and domain types
 * inline; a clustered table becomes an index-organized table at
 * creation (ORGANIZATION INDEX).
 */
import { createExprNode } from '@aelastics/synthesis/jsx'
import type { SynthHeaderInput } from '@aelastics/synthesis/envelope'
import { presetModel, standardSqlChoices } from 'rel-to-sql-ddl/presets'

export const $synth = {
  kind: 'configuration-model',
  metamodel: '@aelastics/synthesis/metamodels/configuration/model',
  author: 'Sinisa Neskovic',
  version: '0.1.0',
  description: 'The Oracle dialect preset for rel-to-sql-ddl: trigger emulation, inline domain types, index-organized clustering'
} as const satisfies SynthHeaderInput

export default presetModel('OraclePreset', {
  ...standardSqlChoices(),
  SqlDialect: 'Oracle',
  ReferentialActions: 'TriggerEmulation',
  DomainHandling: 'InlineTypes',
})
