/** @jsx createExprNode */

import { createExprNode } from '@aelastics/synthesis/jsx'
import { presetModel, standardSqlChoices } from 'rel-to-sql-ddl/presets'

export const $synth = {
  kind: 'configuration-model',
  metamodel: '@aelastics/synthesis/metamodels/configuration/model',
  author: 'Sinisa Neskovic',
  version: '0.1.0',
  description: 'The standard-sql dialect preset for rel-to-sql-ddl: portable SQL, source-agnostic'
} as const

export default presetModel('StandardSqlPreset', standardSqlChoices())
