export interface ModelHandle {
  name: string
  filePath: string
}

export interface CommandResult {
  success: boolean
  errors: string[]
}

export interface GenerateResult extends CommandResult {
  filesWritten: string[]
}
