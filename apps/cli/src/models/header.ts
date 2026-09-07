export type SynthHeaderKind =
  | 'model'
  | 'metamodel'
  | 'decision-model'
  | 'binding-model'
  | 'configuration-model'

export interface SynthGeneratedBy {
  tx: string
  txVersion?: string
  config?: string
  /** Verbatim --param JSON of the generating run, when one was given. */
  param?: string
  date: string
}

export interface SynthHeader {
  kind: SynthHeaderKind
  metamodel: string
  references: Record<string, string>
  generatedBy: SynthGeneratedBy | null
  createdAt: string
  modifiedAt: string
  author: string
  version: string
  description: string
  tags: string[]
  license: string | null
  custom: Record<string, unknown>
}

export interface ParseSynthHeaderResult {
  header: SynthHeader | null
  error?: string
}

export const SYNTH_HEADER_KINDS: readonly SynthHeaderKind[] = [
  'model',
  'metamodel',
  'decision-model',
  'binding-model',
  'configuration-model'
]

const SYNTH_EXPORT_RE = /export\s+const\s+\$synth\s*=/

class LiteralParseError extends Error {
  public constructor(
    message: string,
    public readonly offset: number
  ) {
    super(message)
  }
}

function isIdentStart(ch: string): boolean {
  return /[A-Za-z_$]/.test(ch)
}

function isIdentPart(ch: string): boolean {
  return /[A-Za-z0-9_$]/.test(ch)
}

/** Strict plain-object check: object literals only, no class instances. */
export function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value) && Object.getPrototypeOf(value) === Object.prototype
}

// Recursive-descent parser for the pure-literal subset: strings, numbers,
// true/false/null, arrays, object literals with identifier or string keys,
// trailing commas. Never executes code.
class LiteralParser {
  private pos: number

  public constructor(
    private readonly text: string,
    start: number
  ) {
    this.pos = start
  }

  public get end(): number {
    return this.pos
  }

  public skipWhitespace(): void {
    while (this.pos < this.text.length) {
      const ch = this.text[this.pos]
      if (ch === ' ' || ch === '\t' || ch === '\n' || ch === '\r') {
        this.pos++
      } else if (ch === '/' && (this.text[this.pos + 1] === '/' || this.text[this.pos + 1] === '*')) {
        this.fail('comments are not supported inside the $synth literal')
      } else {
        break
      }
    }
  }

  public parseValue(): unknown {
    this.skipWhitespace()
    if (this.pos >= this.text.length) {
      this.fail('unexpected end of file')
    }
    const ch = this.text[this.pos]
    if (ch === '{') return this.parseObject()
    if (ch === '[') return this.parseArray()
    if (ch === "'" || ch === '"') return this.parseString()
    if (ch === '`') {
      this.fail('template literals are not supported')
    }
    if (/[0-9.]/.test(ch) || ((ch === '-' || ch === '+') && /[0-9.]/.test(this.text[this.pos + 1] ?? ''))) {
      return this.parseNumber()
    }
    if (isIdentStart(ch)) {
      return this.parseIdentifierValue()
    }
    this.fail(`unexpected character '${ch}'`)
  }

  private parseObject(): Record<string, unknown> {
    this.pos++ // consume '{'
    const result: Record<string, unknown> = {}
    for (;;) {
      this.skipWhitespace()
      if (this.pos >= this.text.length) {
        this.fail('unterminated object literal')
      }
      if (this.text[this.pos] === '}') {
        this.pos++
        return result
      }
      if (this.text.startsWith('...', this.pos)) {
        this.fail('spread elements are not supported')
      }
      if (this.text[this.pos] === '[') {
        this.fail('computed property keys are not supported')
      }
      const key = this.parseKey()
      this.skipWhitespace()
      if (this.text[this.pos] !== ':') {
        this.fail(`shorthand property '${key}' is not supported; expected ':'`)
      }
      this.pos++
      result[key] = this.parseValue()
      this.skipWhitespace()
      if (this.text[this.pos] === ',') {
        this.pos++
      } else if (this.text[this.pos] !== '}') {
        this.fail(`expected ',' or '}' in object literal`)
      }
    }
  }

  private parseKey(): string {
    const ch = this.text[this.pos]
    if (ch === "'" || ch === '"') {
      return this.parseString()
    }
    if (!isIdentStart(ch)) {
      this.fail(`invalid property key starting with '${ch}'`)
    }
    const start = this.pos
    while (this.pos < this.text.length && isIdentPart(this.text[this.pos])) {
      this.pos++
    }
    return this.text.slice(start, this.pos)
  }

  private parseArray(): unknown[] {
    this.pos++ // consume '['
    const result: unknown[] = []
    for (;;) {
      this.skipWhitespace()
      if (this.pos >= this.text.length) {
        this.fail('unterminated array literal')
      }
      if (this.text[this.pos] === ']') {
        this.pos++
        return result
      }
      if (this.text.startsWith('...', this.pos)) {
        this.fail('spread elements are not supported')
      }
      result.push(this.parseValue())
      this.skipWhitespace()
      if (this.text[this.pos] === ',') {
        this.pos++
      } else if (this.text[this.pos] !== ']') {
        this.fail(`expected ',' or ']' in array literal`)
      }
    }
  }

  private parseString(): string {
    const quote = this.text[this.pos]
    this.pos++
    let value = ''
    while (this.pos < this.text.length) {
      const ch = this.text[this.pos]
      if (ch === quote) {
        this.pos++
        return value
      }
      if (ch === '\n' || ch === '\r') {
        this.fail('unterminated string literal')
      }
      if (ch === '\\') {
        this.pos++
        value += this.parseEscape()
      } else {
        value += ch
        this.pos++
      }
    }
    this.fail('unterminated string literal')
  }

  private parseEscape(): string {
    const ch = this.text[this.pos]
    if (ch === undefined) {
      this.fail('unterminated string literal')
    }
    this.pos++
    switch (ch) {
      case 'n':
        return '\n'
      case 't':
        return '\t'
      case 'r':
        return '\r'
      case 'b':
        return '\b'
      case 'f':
        return '\f'
      case 'v':
        return '\v'
      case '0':
        return '\0'
      case 'x':
        return this.parseHexEscape(2)
      case 'u':
        if (this.text[this.pos] === '{') {
          this.pos++
          const start = this.pos
          while (this.pos < this.text.length && this.text[this.pos] !== '}') {
            this.pos++
          }
          if (this.text[this.pos] !== '}') {
            this.fail('unterminated unicode escape')
          }
          const hex = this.text.slice(start, this.pos)
          this.pos++
          if (!/^[0-9a-fA-F]+$/.test(hex)) {
            this.fail(`invalid unicode escape '\\u{${hex}}'`)
          }
          return String.fromCodePoint(parseInt(hex, 16))
        }
        return this.parseHexEscape(4)
      case '\n':
        return ''
      default:
        return ch
    }
  }

  private parseHexEscape(length: number): string {
    const hex = this.text.slice(this.pos, this.pos + length)
    if (hex.length < length || !/^[0-9a-fA-F]+$/.test(hex)) {
      this.fail(`invalid hex escape '\\${this.text[this.pos - 1]}${hex}'`)
    }
    this.pos += length
    return String.fromCharCode(parseInt(hex, 16))
  }

  private parseNumber(): number {
    let sign = 1
    if (this.text[this.pos] === '-') {
      sign = -1
      this.pos++
    } else if (this.text[this.pos] === '+') {
      this.pos++
    }
    const match = /^(?:0[xX][0-9a-fA-F]+|(?:[0-9]+(?:\.[0-9]*)?|\.[0-9]+)(?:[eE][+-]?[0-9]+)?)/.exec(this.text.slice(this.pos))
    if (!match) {
      this.fail('invalid number literal')
    }
    const value = Number(match[0])
    if (Number.isNaN(value)) {
      this.fail(`invalid number literal '${match[0]}'`)
    }
    this.pos += match[0].length
    return sign * value
  }

  private parseIdentifierValue(): unknown {
    const start = this.pos
    while (this.pos < this.text.length && (isIdentPart(this.text[this.pos]) || this.text[this.pos] === '.')) {
      this.pos++
    }
    const name = this.text.slice(start, this.pos)
    if (name === 'true') return true
    if (name === 'false') return false
    if (name === 'null') return null
    const after = this.pos
    this.skipWhitespace()
    if (this.text[this.pos] === '(') {
      this.pos = start
      this.fail(`function calls are not supported (found '${name}(')`)
    }
    if (this.text[this.pos] === '`') {
      this.pos = start
      this.fail('template literals are not supported')
    }
    this.pos = after
    if (name === 'undefined') {
      this.pos = start
      this.fail(`'undefined' is not supported; use null`)
    }
    this.pos = start
    this.fail(`identifier '${name}' is not a supported value; only literals are allowed`)
  }

  private fail(message: string): never {
    throw new LiteralParseError(message, this.pos)
  }
}

function describePosition(text: string, offset: number): string {
  let line = 1
  let column = 1
  const limit = Math.min(offset, text.length)
  for (let i = 0; i < limit; i++) {
    if (text[i] === '\n') {
      line++
      column = 1
    } else {
      column++
    }
  }
  return `line ${line}, column ${column}`
}

function normalizeHeader(raw: Record<string, unknown>): SynthHeader {
  const kind = raw.kind
  if (kind === undefined) {
    throw new Error(`missing required field 'kind'`)
  }
  if (typeof kind !== 'string' || !SYNTH_HEADER_KINDS.includes(kind as SynthHeaderKind)) {
    throw new Error(`invalid kind '${String(kind)}'; expected one of: ${SYNTH_HEADER_KINDS.join(', ')}`)
  }
  const metamodel = raw.metamodel
  if (metamodel === undefined) {
    throw new Error(`missing required field 'metamodel'`)
  }
  if (typeof metamodel !== 'string') {
    throw new Error(`field 'metamodel' must be a string`)
  }

  const stringField = (name: string): string => {
    const value = raw[name]
    if (value === undefined) return ''
    if (typeof value !== 'string') {
      throw new Error(`field '${name}' must be a string`)
    }
    return value
  }

  const references: Record<string, string> = {}
  if (raw.references !== undefined) {
    if (!isPlainObject(raw.references)) {
      throw new Error(`field 'references' must be an object with string values`)
    }
    for (const [key, value] of Object.entries(raw.references)) {
      if (typeof value !== 'string') {
        throw new Error(`field 'references' must be an object with string values (key '${key}' is not a string)`)
      }
      references[key] = value
    }
  }

  let generatedBy: SynthGeneratedBy | null = null
  if (raw.generatedBy !== undefined && raw.generatedBy !== null) {
    if (!isPlainObject(raw.generatedBy)) {
      throw new Error(`field 'generatedBy' must be null or an object`)
    }
    const gb = raw.generatedBy
    if (typeof gb.tx !== 'string') {
      throw new Error(`field 'generatedBy.tx' must be a string`)
    }
    if (typeof gb.date !== 'string') {
      throw new Error(`field 'generatedBy.date' must be a string`)
    }
    generatedBy = { tx: gb.tx, date: gb.date }
    if (gb.txVersion !== undefined) {
      if (typeof gb.txVersion !== 'string') {
        throw new Error(`field 'generatedBy.txVersion' must be a string`)
      }
      generatedBy.txVersion = gb.txVersion
    }
    if (gb.config !== undefined) {
      if (typeof gb.config !== 'string') {
        throw new Error(`field 'generatedBy.config' must be a string`)
      }
      generatedBy.config = gb.config
    }
    if (gb.param !== undefined) {
      if (typeof gb.param !== 'string') {
        throw new Error(`field 'generatedBy.param' must be a string`)
      }
      generatedBy.param = gb.param
    }
  }

  const tags: string[] = []
  if (raw.tags !== undefined) {
    if (!Array.isArray(raw.tags)) {
      throw new Error(`field 'tags' must be an array of strings`)
    }
    for (const tag of raw.tags) {
      if (typeof tag !== 'string') {
        throw new Error(`field 'tags' must be an array of strings`)
      }
      tags.push(tag)
    }
  }

  let license: string | null = null
  if (raw.license !== undefined && raw.license !== null) {
    if (typeof raw.license !== 'string') {
      throw new Error(`field 'license' must be a string or null`)
    }
    license = raw.license
  }

  let custom: Record<string, unknown> = {}
  if (raw.custom !== undefined) {
    if (!isPlainObject(raw.custom)) {
      throw new Error(`field 'custom' must be an object`)
    }
    custom = raw.custom
  }

  return {
    kind: kind as SynthHeaderKind,
    metamodel,
    references,
    generatedBy,
    createdAt: stringField('createdAt'),
    modifiedAt: stringField('modifiedAt'),
    author: stringField('author'),
    version: stringField('version'),
    description: stringField('description'),
    tags,
    license,
    custom
  }
}

export function parseSynthHeader(fileText: string): ParseSynthHeaderResult {
  const match = SYNTH_EXPORT_RE.exec(fileText)
  if (!match) {
    return { header: null }
  }
  const parser = new LiteralParser(fileText, match.index + match[0].length)
  try {
    parser.skipWhitespace()
    if (fileText[parser.end] !== '{') {
      throw new LiteralParseError(`expected an object literal after 'export const $synth ='`, parser.end)
    }
    const raw = parser.parseValue() as Record<string, unknown>
    return { header: normalizeHeader(raw) }
  } catch (err) {
    if (err instanceof LiteralParseError) {
      return { header: null, error: `${err.message} (${describePosition(fileText, err.offset)})` }
    }
    return { header: null, error: (err as Error).message }
  }
}

function quoteSingle(value: string): string {
  let out = "'"
  for (const ch of value) {
    switch (ch) {
      case '\\':
        out += '\\\\'
        break
      case "'":
        out += "\\'"
        break
      case '\n':
        out += '\\n'
        break
      case '\r':
        out += '\\r'
        break
      case '\t':
        out += '\\t'
        break
      case '\b':
        out += '\\b'
        break
      case '\f':
        out += '\\f'
        break
      case '\v':
        out += '\\v'
        break
      case '\0':
        out += '\\0'
        break
      default:
        if (ch < ' ') {
          out += `\\u${ch.charCodeAt(0).toString(16).padStart(4, '0')}`
        } else {
          out += ch
        }
    }
  }
  return out + "'"
}

function serializeKey(key: string): string {
  return /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(key) ? key : quoteSingle(key)
}

function serializeValue(value: unknown, depth: number): string {
  if (value === null) return 'null'
  if (typeof value === 'string') return quoteSingle(value)
  if (typeof value === 'boolean') return value ? 'true' : 'false'
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) {
      throw new TypeError(`cannot serialize non-finite number ${value} in $synth header`)
    }
    return String(value)
  }
  const indent = '  '.repeat(depth)
  const innerIndent = '  '.repeat(depth + 1)
  if (Array.isArray(value)) {
    const items = value.filter((item) => item !== undefined).map((item) => serializeValue(item, depth + 1))
    if (items.length === 0) return '[]'
    if (items.some((item) => item.includes('\n'))) {
      return `[\n${items.map((item) => innerIndent + item).join(',\n')}\n${indent}]`
    }
    return `[${items.join(', ')}]`
  }
  if (isPlainObject(value)) {
    const entries = Object.entries(value).filter(([, v]) => v !== undefined)
    if (entries.length === 0) return '{}'
    const body = entries
      .map(([key, v]) => `${innerIndent}${serializeKey(key)}: ${serializeValue(v, depth + 1)}`)
      .join(',\n')
    return `{\n${body}\n${indent}}`
  }
  throw new TypeError(`cannot serialize value of type ${typeof value} in $synth header`)
}

export function serializeSynthHeader(header: SynthHeader): string {
  let generatedBy: Record<string, unknown> | null = null
  if (header.generatedBy !== null) {
    generatedBy = { tx: header.generatedBy.tx }
    if (header.generatedBy.txVersion !== undefined) generatedBy.txVersion = header.generatedBy.txVersion
    if (header.generatedBy.config !== undefined) generatedBy.config = header.generatedBy.config
    if (header.generatedBy.param !== undefined) generatedBy.param = header.generatedBy.param
    generatedBy.date = header.generatedBy.date
  }
  const fields: Record<string, unknown> = {
    kind: header.kind,
    metamodel: header.metamodel,
    references: header.references,
    generatedBy,
    createdAt: header.createdAt,
    modifiedAt: header.modifiedAt,
    author: header.author,
    version: header.version,
    description: header.description,
    tags: header.tags,
    license: header.license,
    custom: header.custom
  }
  const body = Object.entries(fields)
    .map(([key, value]) => `  ${key}: ${serializeValue(value, 1)}`)
    .join(',\n')
  return `export const $synth = {\n${body}\n} as const`
}

// String- and comment-aware scan from an opening '{' to its matching '}'.
// Returns the index just past the closing brace, or -1 when unbalanced.
function findLiteralEnd(text: string, openBrace: number): number {
  let depth = 0
  let i = openBrace
  while (i < text.length) {
    const ch = text[i]
    if (ch === "'" || ch === '"' || ch === '`') {
      i++
      while (i < text.length && text[i] !== ch) {
        if (text[i] === '\\') i++
        i++
      }
      i++
      continue
    }
    if (ch === '/' && text[i + 1] === '/') {
      while (i < text.length && text[i] !== '\n') i++
      continue
    }
    if (ch === '/' && text[i + 1] === '*') {
      const close = text.indexOf('*/', i + 2)
      if (close < 0) return -1
      i = close + 2
      continue
    }
    if (ch === '{') depth++
    if (ch === '}') {
      depth--
      if (depth === 0) return i + 1
    }
    i++
  }
  return -1
}

interface ExportSpan {
  start: number
  end: number
}

function findSynthExportSpan(text: string): ExportSpan | null {
  const match = SYNTH_EXPORT_RE.exec(text)
  if (!match) return null
  let pos = match.index + match[0].length
  while (pos < text.length && /\s/.test(text[pos])) pos++
  if (text[pos] !== '{') return null
  let end = findLiteralEnd(text, pos)
  if (end < 0) {
    throw new Error('existing $synth export has an unbalanced object literal')
  }
  const asConst = /^\s*as\s+const\b/.exec(text.slice(end))
  if (asConst) end += asConst[0].length
  const semi = /^[ \t]*;/.exec(text.slice(end))
  if (semi) end += semi[0].length
  return { start: match.index, end }
}

function skipWhitespaceAndComments(text: string, pos: number): number {
  for (;;) {
    while (pos < text.length && /\s/.test(text[pos])) pos++
    if (text[pos] === '/' && text[pos + 1] === '/') {
      while (pos < text.length && text[pos] !== '\n') pos++
      continue
    }
    if (text[pos] === '/' && text[pos + 1] === '*') {
      const close = text.indexOf('*/', pos + 2)
      if (close < 0) return text.length
      pos = close + 2
      continue
    }
    return pos
  }
}

// End of the last top-level import statement, or -1 when the file has none.
function findLastImportEnd(text: string): number {
  let pos = 0
  let lastEnd = -1
  for (;;) {
    pos = skipWhitespaceAndComments(text, pos)
    if (!text.startsWith('import', pos) || isIdentPart(text[pos + 6] ?? '')) break
    let i = pos + 6
    while (i < text.length && /\s/.test(text[i])) i++
    // import.meta / import(...) are expressions, not import declarations
    if (text[i] === '.' || text[i] === '(') break
    // the first string literal in an import declaration is the module specifier
    let specifierEnd = -1
    while (i < text.length) {
      const ch = text[i]
      if (ch === "'" || ch === '"') {
        i++
        while (i < text.length && text[i] !== ch) {
          if (text[i] === '\\') i++
          i++
        }
        specifierEnd = i + 1
        break
      }
      i++
    }
    if (specifierEnd < 0) break
    let end = specifierEnd
    const attrs = /^\s*(?:with|assert)\s*\{/.exec(text.slice(end))
    if (attrs) {
      const attrsEnd = findLiteralEnd(text, end + attrs[0].length - 1)
      if (attrsEnd > 0) end = attrsEnd
    }
    const semi = /^[ \t]*;/.exec(text.slice(end))
    if (semi) end += semi[0].length
    lastEnd = end
    pos = end
  }
  return lastEnd
}

export function writeSynthHeader(fileText: string, header: SynthHeader): string {
  const serialized = serializeSynthHeader(header)
  const span = findSynthExportSpan(fileText)
  if (span) {
    return fileText.slice(0, span.start) + serialized + fileText.slice(span.end)
  }
  const importEnd = findLastImportEnd(fileText)
  if (importEnd >= 0) {
    const rest = fileText.slice(importEnd)
    const restContent = rest.replace(/^\s*/, '')
    if (restContent === '') {
      return fileText.slice(0, importEnd) + '\n\n' + serialized + '\n'
    }
    return fileText.slice(0, importEnd) + '\n\n' + serialized + '\n\n' + restContent
  }
  const content = fileText.replace(/^\s*/, '')
  if (content === '') {
    return serialized + '\n'
  }
  return serialized + '\n\n' + content
}
