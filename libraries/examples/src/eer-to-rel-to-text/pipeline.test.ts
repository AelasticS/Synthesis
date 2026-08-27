import { runEerToRelToText } from "./pipeline"

describe("EER -> Rel -> SQL DDL showcase", () => {
  it("generates non-empty SQL DDL", async () => {
    const { sql } = await runEerToRelToText()
    expect(sql).toContain("CREATE TABLE")
    expect(sql.length).toBeGreaterThan(50)
  })

  it("emits CREATE TABLE for Person and Organization (snake_case)", async () => {
    const { sql } = await runEerToRelToText()
    // The decision model defaults to snake_case, so identifiers come out
    // lower-cased with underscores.
    expect(sql).toMatch(/create\s+table\s+person/i)
    expect(sql).toMatch(/create\s+table\s+organization/i)
  })

  it("emits REFERENCES targets that match the created table names", async () => {
    const { sql } = await runEerToRelToText()
    // FK REFERENCES must go through the same naming convention as the
    // CREATE TABLE identifiers — a raw entity name (e.g. 'Organization')
    // would reference a table that does not exist.
    const tables = new Set([...sql.matchAll(/CREATE TABLE (\w+) \(/g)].map((m) => m[1]))
    const refs = [...sql.matchAll(/REFERENCES (\w+)/g)].map((m) => m[1])
    expect(refs.length).toBeGreaterThan(0)
    for (const ref of refs) {
      expect(tables).toContain(ref)
    }
  })

  it("runs the DDL step without a configuration model via the @Default option", async () => {
    // Store-only construction of Rel2DdlTransformation: no configuration
    // model at all. The Unquoted option is marked @Default, so the
    // transformation must still produce unquoted identifiers.
    const { sql } = await runEerToRelToText({ withDdlConfig: false })
    expect(sql).toMatch(/create\s+table\s+person/i)
    expect(sql).not.toContain('CREATE TABLE "')
  })
})
