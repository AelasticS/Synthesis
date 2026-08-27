import { join, resolve, sep } from 'node:path'

import { resolveDocDest, uniqueJsxTags } from '../output.js'

describe('uniqueJsxTags', () => {
  it('collects distinct capitalized tags, sorted', () => {
    const jsx = '<Schema name="s">\n  <Table name="t">\n    <Column name="c"/>\n  </Table>\n  <Table name="u"/>\n</Schema>'
    expect(uniqueJsxTags(jsx)).toEqual(['Column', 'Schema', 'Table'])
  })

  it('ignores tag-like text inside double-quoted attribute strings', () => {
    const jsx = '<Attribute name="pets" type="Set<Person>"/>'
    expect(uniqueJsxTags(jsx)).toEqual(['Attribute'])
  })

  it('ignores tag-like text inside single-quoted attribute strings', () => {
    const jsx = "<Attribute name='pets' type='Map<Key,Value>'/>"
    expect(uniqueJsxTags(jsx)).toEqual(['Attribute'])
  })

  it('still finds real tags that follow quoted attributes', () => {
    const jsx = '<Schema name="a<b">\n<Table name="x"/>\n</Schema>'
    expect(uniqueJsxTags(jsx)).toEqual(['Schema', 'Table'])
  })

  it('ignores lowercase tags and returns [] for tagless text', () => {
    expect(uniqueJsxTags('<div><span/></div>')).toEqual([])
    expect(uniqueJsxTags('plain text')).toEqual([])
  })
})

describe('resolveDocDest', () => {
  const outRoot = resolve(sep, 'work', 'out')

  it('resolves a plain file name under the output root', () => {
    expect(resolveDocDest(outRoot, 'schema.sql')).toEqual({ dest: join(outRoot, 'schema.sql') })
  })

  it('resolves nested paths under the output root', () => {
    expect(resolveDocDest(outRoot, 'sub/dir/file.sql')).toEqual({
      dest: join(outRoot, 'sub', 'dir', 'file.sql')
    })
  })

  it('rejects empty and whitespace-only document paths', () => {
    expect(resolveDocDest(outRoot, '')).toEqual({ error: 'empty document path' })
    expect(resolveDocDest(outRoot, '   ')).toEqual({ error: 'empty document path' })
  })

  it(`rejects '.' and paths that resolve to the output root itself`, () => {
    expect(resolveDocDest(outRoot, '.')).toEqual({ error: 'empty document path' })
    expect(resolveDocDest(outRoot, 'sub/..')).toEqual({
      error: 'resolves to the output directory itself'
    })
  })

  it('rejects paths escaping the output root', () => {
    expect(resolveDocDest(outRoot, '../escape.sql')).toEqual({
      error: 'resolves outside the output directory'
    })
    expect(resolveDocDest(outRoot, 'sub/../../escape.sql')).toEqual({
      error: 'resolves outside the output directory'
    })
  })

  it('rejects absolute paths outside the output root', () => {
    expect(resolveDocDest(outRoot, resolve(sep, 'etc', 'passwd'))).toEqual({
      error: 'resolves outside the output directory'
    })
  })

  it('rejects sibling directories sharing the root as a name prefix', () => {
    expect(resolveDocDest(outRoot, `${outRoot}-sibling/file.sql`)).toEqual({
      error: 'resolves outside the output directory'
    })
  })
})
