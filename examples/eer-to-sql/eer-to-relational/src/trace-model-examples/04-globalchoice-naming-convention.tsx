/** @jsx h */
/**
 * NIJE DEO PROJEKTA — samo za vizuelizaciju predloženog TraceModel-a.
 * Ne komitovati. Vidi _dummy-components.tsx.
 *
 * Scenario: GlobalChoice / ModelIssue, ulaz je STRING, ne ModelElement.
 * Realno iz transformation.tsx:
 *
 *   @E2E()
 *   domainToDomain(d: em.IDomain) {
 *     return <RelDomain name={this.applyNaming(String(d.name))} .../>
 *   }
 *
 *   @VarPoint("NamingConvention")
 *   applyNaming(name: string): string { ... }
 *   @VarOption("applyNaming", Option("CamelCase")) applyCamelCaseNaming(name) {...}
 *   @Default() @VarOption("applyNaming", Option("SnakeCase")) applySnakeCaseNaming(name) {...}
 *
 * decision-model.tsx: NamingConvention je ModelIssue (CamelCase / SnakeCase=default).
 * `applyNaming` prima string ("d_book_title"), ne element — duck-typing
 * provera u var-decorators.ts pada na "nije objekat", pa `element` na
 * fact-u nikad nije postavljen ni da je issue slučajno ElementIssue.
 *
 * Dva pod-primera, ista transformacija, RAZLIČITA konfiguracija:
 *  (a) GlobalChoice postoji → ModelResolution postoji, choices=[gc_naming].
 *  (b) GlobalChoice NE postoji → NEMA ModelResolution uopšte (dogovoreno:
 *      globalna rezolucija je čist odraz GlobalChoice-a, nema "prazno +
 *      byDefault" varijante kao kod ElementResolution).
 */
import { h, TraceModel, ElementMapping, ModelResolution, ElementRef, ChoiceRef, ModelRef, ConfigModelRef } from "./_dummy-components.js"

// (a) Konfiguracija SADRŽI GlobalChoice "gc_naming" → CamelCase.
const traceWithNamingConfigured = (
  <TraceModel
    name="EERtoREL_trace_a"
    timestamp="2026-09-19T10:00:00Z"
    transformation="EERtoRelationalSchema"
    source={<ModelRef path="/EERModel" />}
    targets={[<ModelRef path="/RelModel" />]}
    config={<ConfigModelRef path="/RelSchemaConfig" />}
  >
    <ElementMapping
      name="domainToDomain_dBookTitle"
      rule="domainToDomain"
      source={<ElementRef path="/EERModel/d_book_title" />}
      targets={[<ElementRef path="/RelModel/dBookTitle" />]}
    >
      {/* prazno — applyNaming je pozvan sa STRINGOM, ne sa /EERModel/d_book_title
          elementom, pa se ova (globalna) rezolucija ne kači na ovaj entry */}
    </ElementMapping>

    <ModelResolution name="r1_NamingConvention" byDefault={false}>
      <ChoiceRef path="/RelSchemaConfig/gc_naming" />
    </ModelResolution>
  </TraceModel>
)

// (b) Konfiguracija NE SADRŽI GlobalChoice za NamingConvention —
// applyNaming i dalje radi (pada na @Default → SnakeCase), ali se to
// NIGDE ne beleži u trace-u: nema ModelResolution za NamingConvention.
const traceWithoutNamingConfigured = (
  <TraceModel
    name="EERtoREL_trace_b"
    timestamp="2026-09-19T10:05:00Z"
    transformation="EERtoRelationalSchema"
    source={<ModelRef path="/EERModel" />}
    targets={[<ModelRef path="/RelModel" />]}
    config={<ConfigModelRef path="/RelSchemaConfig_minimal" />}
  >
    <ElementMapping
      name="domainToDomain_dBookTitle"
      rule="domainToDomain"
      source={<ElementRef path="/EERModel/d_book_title" />}
      targets={[<ElementRef path="/RelModel/d_book_title" />]}
    />
    {/* nema nijedne <ModelResolution> ovde — SnakeCase je primenjen,
        ali pošto GlobalChoice ne postoji, nema šta da se referencira */}
  </TraceModel>
)

export const examples = [traceWithNamingConfigured, traceWithoutNamingConfigured]
