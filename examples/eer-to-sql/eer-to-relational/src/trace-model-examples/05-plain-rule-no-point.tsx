/** @jsx h */
/**
 * NIJE DEO PROJEKTA — samo za vizuelizaciju predloženog TraceModel-a.
 * Ne komitovati. Vidi _dummy-components.tsx.
 *
 * Scenario: kompletnosti radi — obično @E2E pravilo, BEZ ikakvog
 * VarPoint/SpecPoint. Realno iz transformation.tsx:
 *
 *   @E2E()
 *   domainToDomain(d: em.IDomain): ExprNode<rmT.IDomain> {
 *     return <RelDomain name={this.applyNaming(String(d.name))} .../>
 *   }
 *
 * Ovde gledamo `domainToDomain` entry SAM PO SEBI (u primeru 04 smo
 * gledali šta se dešava sa NJEGOVIM ugnježdenim applyNaming pozivom;
 * ovde je fokus na entry-ju samom): nema dispatch-a na entry nivou
 * (nije ni VarPoint ni SpecPoint dispečer), pa:
 *  - `rule` = ime same metode, BEZ preimenovanja (nema šta da se
 *    preimenuje — nema pointReg-a za @E2E da konsultuje).
 *  - `resolutions` je prazan niz — ne zato što je nešto konsultovano
 *    pa nije zapisano (kao kod SpecPoint-a), nego zato što na OVOM
 *    entry-ju uopšte nema tačke odlučivanja.
 */
import { h, ElementMapping, ElementRef } from "./_dummy-components.js"

const plainDomainToDomain = (
  <ElementMapping
    name="domainToDomain_dPersonName"
    rule="domainToDomain"
    source={<ElementRef path="/EERModel/d_person_name" />}
    targets={[<ElementRef path="/RelModel/d_person_name" />]}
  >
    {/* prazno — nema VarPoint/SpecPoint na ovom pravilu uopšte */}
  </ElementMapping>
)

export const examples = [plainDomainToDomain]
