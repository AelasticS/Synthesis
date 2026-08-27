/**
 * Configuration manager for loading/saving workspace config.
 */

import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { homedir } from 'node:os'
import {
  WorkspaceConfig,
  DEFAULT_CONFIG,
  CONFIG_FILENAME,
  WORKSPACE_DIRS
} from './schema.js'

/**
 * Resolve ~ to home directory
 */
export function expandPath(path: string): string {
  if (path.startsWith('~/')) {
    return join(homedir(), path.slice(2))
  }
  return path
}

/**
 * Get the global config file path (~/.synth/config.json)
 */
export function getGlobalConfigPath(): string {
  return expandPath(`~/.synth/${CONFIG_FILENAME}`)
}

/**
 * Load workspace configuration.
 * Returns default config if file doesn't exist.
 */
export async function loadConfig(): Promise<WorkspaceConfig> {
  const configPath = getGlobalConfigPath()

  if (!existsSync(configPath)) {
    return { ...DEFAULT_CONFIG }
  }

  try {
    const content = await readFile(configPath, 'utf-8')
    const parsed = JSON.parse(content) as Partial<WorkspaceConfig>
    return {
      ...DEFAULT_CONFIG,
      ...parsed
    }
  } catch {
    return { ...DEFAULT_CONFIG }
  }
}

/**
 * Save workspace configuration.
 */
export async function saveConfig(config: WorkspaceConfig): Promise<void> {
  const configPath = getGlobalConfigPath()
  const configDir = dirname(configPath)

  if (!existsSync(configDir)) {
    await mkdir(configDir, { recursive: true })
  }

  await writeFile(configPath, JSON.stringify(config, null, 2) + '\n', 'utf-8')
}

/**
 * Get the resolved workspace path (expanded).
 */
export function getWorkspacePath(config: WorkspaceConfig): string {
  return expandPath(config.workspace)
}

/**
 * Get the models directory path.
 */
export function getModelsPath(config: WorkspaceConfig): string {
  return join(getWorkspacePath(config), WORKSPACE_DIRS.models)
}

/**
 * Get the transformations directory path.
 */
export function getTransformationsPath(config: WorkspaceConfig): string {
  return join(getWorkspacePath(config), WORKSPACE_DIRS.transformations)
}

/**
 * Get the path to a specific namespace folder.
 */
export function getNamespacePath(config: WorkspaceConfig, namespace: string): string {
  return join(getModelsPath(config), namespace)
}

/**
 * Get current namespace path (if set).
 */
export function getCurrentNamespacePath(config: WorkspaceConfig): string | undefined {
  if (!config.currentNamespace) {
    return undefined
  }
  return getNamespacePath(config, config.currentNamespace)
}

/**
 * Check if workspace exists and is initialized.
 */
export function isWorkspaceInitialized(config: WorkspaceConfig): boolean {
  const workspacePath = getWorkspacePath(config)
  const modelsPath = getModelsPath(config)
  return existsSync(workspacePath) && existsSync(modelsPath)
}
