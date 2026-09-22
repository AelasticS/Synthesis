/** @jsx h */
/**
 * NIJE DEO PROJEKTA — samo za vizuelizaciju predloženog TraceModel-a.
 * Ne komitovati. Vidi _dummy-components.tsx za objašnjenje factory-ja.
 *
 * Scenario: @VarPoint("RowHistory") / @VarOption / @Default(), realno iz
 * transformation.tsx (eer-to-relational):
 *
 *   @E2E()
 *   @VarPoint("RowHistory")
 *   entityToTables(e: em.IEntity): ExprNode<rmT.ITable>[] { ... }
 *
 *   @Default() @VarOption("entityToTables", Option("NoHistory"))
 *   currentRowsOnly(e) { return [this.entityToTable(e)!] }
 *
 *   @VarOption("entityToTables", Option("HistoryTable"))
 *   withRowHistory(e) {
 *     return withHistoryTable(() => this.historyDiscriminator(e))(() => this.entityToTable(e)!)()
 *   }
 *
 *   @VarPoint("HistoryDiscriminator")   // ugnježden, BARE VarPoint (bez @E2E)
 *   historyDiscriminator(e) { ... }
 *
 * decision-model.tsx: RowHistory je ElementIssue (NoHistory=default,
 * HistoryTable=opening opcija sa pod-issue-om HistoryDiscriminator).
 *
 * Dva elementa, dva ishoda:
 *  - Person: eksplicitno konfigurisan na HistoryTable (ElementChoice
 *    postoji) → withRowHistory izvršen, PLUS ugnježdeni
 *    HistoryDiscriminator pada na default (nema Choice za njega).
 *  - Organization: ništa konfigurisano za RowHistory → currentRowsOnly
 *    (Default), choices prazno.
 */
import { h, ElementMapping, ElementResolution, ElementRef, ChoiceRef } from "./_dummy-components.js"

// Person: RowHistory eksplicitno → HistoryTable (Choice postoji),
// HistoryDiscriminator ugnježden i pada na default (Choice ne postoji).
const personEntityToTables = (
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
    <ElementResolution
      name="r2_HistoryDiscriminator_Person"
      element={<ElementRef path="/EERModel/Person" />}
      byDefault={true}
    >
      {/* nema dece — nijedan Choice ne postoji za ovaj issue na ovom elementu */}
    </ElementResolution>
  </ElementMapping>
)

// Organization: RowHistory nema nikakve konfiguracije → Default (NoHistory).
const organizationEntityToTables = (
  <ElementMapping
    name="currentRowsOnly_Organization"
    rule="currentRowsOnly"
    source={<ElementRef path="/EERModel/Organization" />}
    targets={[<ElementRef path="/RelModel/organization" />]}
  >
    <ElementResolution
      name="r3_RowHistory_Organization"
      element={<ElementRef path="/EERModel/Organization" />}
      byDefault={true}
    >
      {/* prazno — ni jedna ElementChoice ne dotiče Organization/RowHistory */}
    </ElementResolution>
  </ElementMapping>
)

export const examples = [personEntityToTables, organizationEntityToTables]