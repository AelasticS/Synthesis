/** @jsx h */
/**
 * NIJE DEO PROJEKTA — samo za vizuelizaciju predloženog TraceModel-a.
 * Ne komitovati. Vidi _dummy-components.tsx.
 *
 * Scenario: @SpecPoint()/@SpecOption, realno iz transformation.tsx:
 *
 *   @E2E()
 *   @SpecPoint()
 *   entityToTable(e: em.IEntity): ExprNode<rmT.ITable> | undefined {
 *     return undefined // čist dispečer
 *   }
 *   @SpecOption("entityToTable", em.Kernel)      kernelToTable(e) { ... }
 *   @SpecOption("entityToTable", em.Aggregation) aggregationToTable(g) { ... }
 *   @SpecOption("entityToTable", em.Weak)        weakToTable(w) { ... }
 *
 * Person je Kernel entitet, WorksIn je Aggregation (Person×Organization,
 * kao "works_in"/"employs" iz dekiGenerisao/persons_rel.sql). Bez obzira
 * na entitet, resolutions je UVEK prazan niz — SpecPoint ne konsultuje
 * ConfigurationModel, nema Choice, nema issue. Jedini trag specijalizacije
 * je `rule` (ime konkretne @SpecOption metode, ne "entityToTable").
 */
import { h, ElementMapping, ElementRef } from "./_dummy-components.js"

const personKernelToTable = (
  <ElementMapping
    name="kernelToTable_Person"
    rule="kernelToTable"
    source={<ElementRef path="/EERModel/Person" />}
    targets={[<ElementRef path="/RelModel/person" />]}
  >
    {/* resolutions je namerno prazan — SpecPoint ne proizvodi Resolution */}
  </ElementMapping>
)

const worksInAggregationToTable = (
  <ElementMapping
    name="aggregationToTable_WorksIn"
    rule="aggregationToTable"
    source={<ElementRef path="/EERModel/WorksIn" />}
    targets={[<ElementRef path="/RelModel/works_in" />]}
  >
    {/* i ovde prazno, iz istog razloga */}
  </ElementMapping>
)

export const examples = [personKernelToTable, worksInAggregationToTable]