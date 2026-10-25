/** @jsx createExprNode */

/*
 * The PostgreSQL preset EXTENDS standard-sql: the spread is the
 * inheritance, the overrides are the dialect. PostgreSQL takes every
 * disconnect action natively and has CREATE DOMAIN, so only the
 * dialect flavor itself differs (physical clustering emits one-time
 * CLUSTER statements).
 */
import { createExprNode } from '@aelastics/synthesis/jsx'
import type { SynthHeaderInput } from '@aelastics/synthesis/envelope'
import { presetModel, standardSqlChoices } from 'rel-to-sql-ddl/presets'

export const $synth = {
  kind: 'configuration-model',
  metamodel: '@aelastics/synthesis/metamodels/configuration/model',
  author: 'Sinisa Neskovic',
  version: '0.1.0',
  description: 'The PostgreSQL dialect preset for rel-to-sql-ddl: standard-sql plus the postgres physical flavor'
} as const satisfies SynthHeaderInput

export default presetModel('PostgresPreset', {
  ...standardSqlChoices(),
  SqlDialect: 'PostgreSql',
})
