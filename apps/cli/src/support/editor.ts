/**
 * Opening a file in the user's editor, shared by `config edit` and
 * `pipeline edit`. `$EDITOR` may legitimately carry arguments (e.g.
 * `code --wait`, `emacs -nw`): the value is split on whitespace — first
 * token the binary, the rest its arguments — and the file is appended.
 * Passing the whole value to spawn as one binary name would break every
 * such editor.
 */

import { spawn } from 'node:child_process'

export async function openInEditor(filePath: string): Promise<void> {
  const editor = process.env.EDITOR?.trim() ?? ''
  const [binary, ...editorArgs] = editor === '' ? ['vi'] : editor.split(/\s+/)
  await new Promise<void>((resolve, reject) => {
    const child = spawn(binary, [...editorArgs, filePath], { stdio: 'inherit' })
    child.on('close', (code) => {
      if (code === 0) {
        resolve()
      } else {
        reject(new Error(`Editor exited with code ${code}`))
      }
    })
    child.on('error', (err) => {
      reject(new Error(`Failed to spawn editor '${binary}': ${err.message}`))
    })
  })
}
