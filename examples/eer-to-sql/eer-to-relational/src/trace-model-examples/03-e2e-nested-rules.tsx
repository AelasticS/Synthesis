/** @jsx h */
/**
 * NIJE DEO PROJEKTA — samo za vizuelizaciju predloženog TraceModel-a.
 * Ne komitovati. Vidi _dummy-components.tsx.
 *
 * Scenario: jedno @E2E pravilo iznutra poziva drugo @E2E pravilo, za
 * ISTI izvorni element. Realno iz transformation.tsx:
 *
 *   @E2E() @VarPoint("RowHistory")
 *   entityToTables(e) { ... }
 *   @VarOption("entityToTables", Option("HistoryTable"))
 *   withRowHistory(e) {
 *     return withHistoryTable(() => this.historyDiscriminator(e))
 *                             (() => this.entityToTable(e)!)()   // <- OVDE
 *   }
 *
 *   @E2E() @SpecPoint()
 *   entityToTable(e) { return undefined }
 *   @SpecOption("entityToTable", em.Kernel) kernelToTable(e) { ... }
 *
 * `withRowHistory` (VarPoint-dispečovano) unutar sebe zove
 * `entityToTable` (SpecPoint-dispečovano) — OBA su @E2E, pa svako
 * dobija SVOJ ElementMapping, isti `source` (Person).
 *
 * VAŽNA NAPOMENA: `parentMapping` je ovde POPULISAN da pokaže
 * NAMERAVANO ponašanje. U pravom kodu danas (2026-09) `parentMapping`/
 * stari `parentRule` se NIGDE ne popunjava (potvrđeno grep-om ranije u
 * razgovoru) — ovo je otvoren implementacioni zadatak, ne postojeće
 * ponašanje.
 */
import { h, ElementMapping, ElementResolution, ElementRef, ChoiceRef, ElementMappingRef } from "./_dummy-components.js"

// Spoljašnji entry: RowHistory VarPoint, dispečovan na withRowHistory.
const outer = (
  <ElementMapping
    name="withRowHistory_Person"
    rule="withRowHistory"
    source={<ElementRef path="/EERModel/Person" />}
    targets={[<ElementRef path="/RelModel/person" />, <ElementRef path="/RelModel/person_history" />]}
  >
    <ElementResolution
      name="r1_RowHistory_Person"
      element={<ElementRef path="/EERModel/Person" />}
      byDefault={false}
    >
      <ChoiceRef path="/RelSchemaConfig/ec_person_row_history" />
    </ElementResolution>
  </ElementMapping>
)

// Unutrašnji entry: SpecPoint dispatch, pozvan IZ withRowHistory-a.
// parentMapping pokazuje na spoljašnji entry — NAMERAVANO, ne stvarno stanje.
const inner = (
  <ElementMapping
    name="kernelToTable_Person_nested"
    rule="kernelToTable"
    source={<ElementRef path="/EERModel/Person" />}
    targets={[<ElementRef path="/RelModel/person" />]}
    parentMapping={<ElementMappingRef path="withRowHistory_Person" />}
  >
    {/* prazno — SpecPoint ne proizvodi Resolution, kao u primeru 02 */}
  </ElementMapping>
)

export const examples = [outer, inner]
