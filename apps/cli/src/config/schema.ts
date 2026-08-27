/**
 * Workspace configuration schema.
 */

export interface TransformationEntry {
  version: string
  path: string
  installedAt: string
}

export interface WorkspaceConfig {
  /** Path to the workspace root */
  workspace: string
  /** Current namespace (folder under models/) */
  currentNamespace?: string
  /** Installed transformations */
  transformations: Record<string, TransformationEntry>
}

export const DEFAULT_WORKSPACE = '~/.synth'

export const DEFAULT_CONFIG: WorkspaceConfig = {
  workspace: DEFAULT_WORKSPACE,
  currentNamespace: undefined,
  transformations: {}
}

/**
 * Workspace directory structure
 */
export const WORKSPACE_DIRS = {
  models: 'models',
  transformations: 'transformations',
  configs: 'configs'
} as const

export const CONFIG_FILENAME = 'config.json'
