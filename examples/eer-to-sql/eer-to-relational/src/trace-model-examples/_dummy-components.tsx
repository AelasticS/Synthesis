/**
 * NIJE DEO PROJEKTA — samo za vizuelizaciju.
 *
 * Minimalni, samostalni JSX factory + "komponente" koje oponašaju
 * PREDLOŽENI (jos neimplementirani) jedinstveni TraceModel dogovoren
 * 2026-09-19: TraceModel / ElementMapping / Resolution (ModelResolution,
 * ElementResolution). Namerno NE koristi pravi `createExprNode`/`ExprNode`
 * iz "@aelastics/synthesis/jsx" niti pravu aelastics-types šemu — te stvari
 * za ovaj predloženi oblik još ne postoje u kodu. Factory ovde vraća `any`
 * pa TypeScript ne pokušava da uskladi rezultat sa pravim globalnim
 * `JSX.Element` tipom iz ostatka projekta — cilj je da fajlovi u ovom
 * folderu budu čitljivi u editoru bez crvenih linija, ne da se izvršavaju.
 *
 * Ne komitovati.
 */

export type DummyNode = {
  tag: string
  props: Record<string, any>
  children: DummyNode[]
}

export function h(tag: any, props: any, ...children: any[]): any {
  const flatChildren: DummyNode[] = children
    .flat(Infinity)
    .filter((c: any) => c !== null && c !== undefined && c !== false)
  if (typeof tag === "function") {
    return tag({ ...(props ?? {}), children: flatChildren })
  }
  return { tag: String(tag), props: props ?? {}, children: flatChildren }
}

// ── reference stand-ins ──────────────────────────────────────────────
// U pravom store-u bi ovo bili $refByName pokazivači na stvaran
// ModelElement / Choice / ElementMapping. Ovde samo nose čitljivu putanju.
export interface RefProps {
  path: string
  children?: any
}
export const ElementRef = (props: RefProps): any => h("ElementRef", props)
export const ChoiceRef = (props: RefProps): any => h("ChoiceRef", props)
export const ConfigModelRef = (props: RefProps): any => h("ConfigModelRef", props)
export const ModelRef = (props: RefProps): any => h("ModelRef", props)
export const ElementMappingRef = (props: RefProps): any => h("ElementMappingRef", props)

// ── predloženi jedinstveni trace metamodel, kao JSX komponente ──────

export interface ElementResolutionProps {
  name: string
  /** ElementRef — element na koji se ova rezolucija odnosi (obavezno). */
  element: any
  /** Da li je aktivirana @Default() opcija VarPoint-a (ne Option.isDefault). */
  byDefault: boolean
  /** 0..* ChoiceRef — SVAKI Choice koji dotiče element se piše, bez obzira na byDefault. */
  children?: any
}
export const ElementResolution = (props: ElementResolutionProps): any =>
  h("ElementResolution", props)

export interface ModelResolutionProps {
  name: string
  byDefault: boolean
  /** Tačno 1 ChoiceRef (GlobalChoice) — ModelResolution postoji SAMO ako GlobalChoice postoji. */
  children?: any
}
export const ModelResolution = (props: ModelResolutionProps): any =>
  h("ModelResolution", props)

export interface ElementMappingProps {
  name: string
  /** Ime KONKRETNO izvršene metode (VarOption/SpecOption), ne dispečera. */
  rule: string
  source: any
  /** 0..* ElementRef — prazno kad pravilo ne pravi nov element (čista odluka). */
  targets?: any
  /** ElementMappingRef — obuhvatajući entry, ako postoji (trenutno se nigde ne popunjava u pravom kodu). */
  parentMapping?: any
  /** 0..* ElementResolution — po JEDNA za svaki konsultovani issue. */
  children?: any
}
export const ElementMapping = (props: ElementMappingProps): any =>
  h("ElementMapping", props)

export interface TraceModelProps {
  name: string
  timestamp: string
  transformation?: string
  source: any
  targets?: any
  /** ConfigModelRef, opciono — transformacije bez odluka ga nemaju. */
  config?: any
  /** 0..* ElementMapping + 0..* ModelResolution, pomešano. */
  children?: any
}
export const TraceModel = (props: TraceModelProps): any => h("TraceModel", props)