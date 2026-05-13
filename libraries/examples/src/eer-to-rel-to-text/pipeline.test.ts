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
})
