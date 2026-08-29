# LLMs and Model-Driven Engineering: Where the Leverage Is (v2)

> Internal strategy documentation for contributors to Synthesis itself.
> Second version, 2026-08-29. The first draft is kept unchanged as
> [llm-and-model-driven-engineering.md](llm-and-model-driven-engineering.md)
> to preserve the record of what was claimed before review. This version
> corrects it after its empirical claims were challenged and checked
> against the literature. Every substantive claim below is mapped to its
> evidence, or explicitly marked as unsourced reasoning, in
> [llm-and-model-driven-engineering-references.md](llm-and-model-driven-engineering-references.md).
> The build plan this position motivates is
> [document-generation.md](document-generation.md).

## What changed from the first version

Four claims in v1 did not survive review:

1. **"Model-driven engineering failed"** overstated the record. MDE is in
   widespread industrial use in partial, domain-specific form, and
   succeeded outright in several industries. What did not materialize is
   the heavyweight whole-system vision of early MDA.
2. **Rare expertise was presented as the central barrier.** The empirical
   studies rank social and organizational factors at least as high as
   technical ones, and put tooling near the top of adoption decisions.
   The skills problem is real but it is one factor, not the explanation.
3. **"Only big companies can amortise the investment"** is contradicted by
   the survey data: more than half of surveyed MDE practitioners worked in
   development organisations under 100 people. The threshold is the shape
   of the domain, not the size of the company.
4. **The 30 to 40 percent generatable fraction was an invented number.**
   The qualitative finding it gestured at is real (MDE generates key
   parts, rarely whole systems); the precision was not.

The thesis survives, but in a narrower and better-grounded form, stated
next.

## The thesis in one paragraph

The empirical literature on MDE says that success is least likely when
domain expertise and modeling expertise sit in different people, and that
the modeling expert needs an unusual dual skill set: abstraction plus
language-and-generator engineering, a pair rarely taught together. That
dual skill set is the genuinely scarce input. What large language models
supply is precisely its language-engineering half. An LLM can draft the
metamodel, the transformations, and the generator scaffolding, letting the
domain expert act as the language engineer without becoming one. So the
division of labour is: **the LLM builds and maintains the generator, the
human reviews the small high-leverage artifacts (metamodel, transformations,
models), deterministic machinery produces the bulk output, and the agent
still hand-writes the part that is not generatable**, because that part is
real and does not go away. What LLMs do not fix is equally important: the
organizational factors and tool maturity that the evidence says dominate
adoption outcomes.

## 1. What actually happened to MDE

The largest independent study of MDE practice (450 practitioners surveyed,
22 interviewed, 17 companies, 9 sectors) found that "some form of MDE is
practised widely", across automotive, banking, printing, web applications
and more, but that developers rarely use it to generate whole systems.
They apply it to key parts of a system, usually through small
domain-specific languages built for narrow, well-understood domains, and
practical domain modeling is "quick and dirty": DSLs with their generators
are sometimes built in as little as two weeks.

Successful adoption was overwhelmingly ground-up. Efforts imposed by
high-level management typically struggled, and the transition from
grassroots use to organisation-wide mandate is where most projects fail.

Individual successes are large and well documented: Motorola's deployment
for telecommunications systems reported dramatic quality and productivity
improvements, attributed to an appropriate modeling language, a powerful
domain-specific code generator, and a deployment support team. And the
commercial descendant of MDE is thriving under another name: the low-code
platform industry, whose relationship to MDE is close enough that the
modeling community debates whether they are two sides of the same coin.

So the corrected history is: the *heavyweight, whole-system, top-down*
version of model-driven development stalled, roughly as its early critics
predicted. The *narrow, domain-specific, ground-up* version quietly won and
is everywhere, from protobuf and OpenAPI generators to ORM schema codegen.
Synthesis is in the second tradition, and the second tradition is the one
the evidence favors.

## 2. The barriers, ranked as the evidence ranks them

The empirical work is blunt: "social and organizational factors are at
least as important in determining success as technical ones."
Specifically:

- **Organizational fit.** MDE is not appropriate for every organisation.
  Companies targeting a particular domain succeed far more often than
  companies writing generic software; a global consultancy reported using
  MDE successfully many times with domain-focused clients while judging it
  unlikely to succeed in-house.
- **Adoption dynamics.** Top-down mandates fail without developer buy-in.
  Middle managers, measured on schedules rather than vision, are a
  recurring bottleneck. Adoption sticks when MDE enables business that was
  otherwise impossible, not when it promises the same work faster and
  cheaper.
- **Tooling.** In one review, tool availability was the single most
  influential factor in adoption decisions, and the state of practice
  study found over 40 modeling languages and over 100 tools in regular
  use with no consensus, concluding that state-of-the-art tools do a poor
  job of supporting development.
- **Skills.** Real, but one factor among these: MDE developers need
  compiler-construction and abstraction skills together; Motorola named
  lack of necessary skills among its major obstacles; one company called
  retraining hundreds of coders for abstract thinking its single largest
  bottleneck; and success drops when domain experts and MDE experts are
  different people.

v1 built its argument on the skills barrier alone. That was a selective
reading, and it matters, because a thesis of the form "LLMs remove the
barrier" inherits the selectivity: LLMs address the skills and authoring
factors and leave the organizational and tooling factors standing.

## 3. What LLMs actually change

**They supply the scarce half of the dual skill set.** Metamodel and
transformation authoring is well-specified, local, testable work, close to
the ideal shape for an LLM, and it is exactly the compiler-skills half
that the evidence says is rare in combination with domain knowledge. The
practitioner finding that DSLs can be built in two weeks already showed
the authoring mountain is smaller than folklore claims, but those two-week
DSLs were built by people who held both skill sets. LLM assistance offers
that speed to teams that hold only the domain half, which is most teams.

**They make model authoring cheap for humans.** The LLM drafts the model
from a natural-language description; the human reviews two hundred lines
instead of writing them.

**They do not fix what the evidence says matters most.** No amount of
LLM capability changes middle-manager incentives, produces the business
driver that adoption needs, or matures a tool ecosystem. A strategy built
on LLM-assisted MDE must plan for those factors separately rather than
assume they dissolve.

**And they raised the bar as well as lowering it.** LLMs made ordinary
boilerplate cheap, which moves the return-on-investment threshold for
building any generator *up*: the alternative to a metamodel is no longer
an expensive human typing repetitive code but a cheap agent doing it.
This cut against v1's optimism and survives into v2 unchanged. It is
unsourced reasoning, marked as such in the references document.

## 4. The division of labour, and where it sits in the research

The working model: the LLM authors the metamodel and transformations,
reviewed carefully because they are small and high-leverage; the LLM
drafts models, reviewed cheaply; deterministic machinery generates the
bulk artifact; the agent hand-writes the rest.

Honesty requires locating this in the current research landscape. The
systematic mapping of LLM-plus-MDE work (86 primary studies, 2022 to
early 2026) finds the field concentrated on *model generation*, while
*DSL engineering and metamodeling remain marginal* research topics, with
limited industry involvement overall. In other words, the corner this
thesis bets on is the least-explored one. Early evidence also shows that
LLM-generated transformation code is frequently syntactically or
semantically wrong out of the box.

Both points argue for, not against, the Synthesis architecture: a typed
model store and metamodel validation turn LLM drift into a hard failure at
a known location, which is the mechanism that makes LLM-authored
generators reviewable and repairable. But the thesis should be presented
as a bet on an open area, not a summary of established results.

## 5. Where the leverage is

An instructive negative finding first. The state of practice study
concluded that "code generation is a red herring": typical measured
productivity gains of 20 to 30 percent are easily offset by training costs
and organizational change, and reported outcomes range from a 27 percent
loss to an 800 percent gain (advocates of domain-specific modeling claim
500 to 1000 percent; the independent numbers are the modest ones).
Companies that stayed with MDE valued other things, above all that
building precise models and generators forces an explicit, documented
architecture.

That reframes rather than weakens the case, because the durable benefits
the evidence found are the ones this document always ranked highest:

- **The review surface collapses.** A human can genuinely review a two
  hundred line model; nobody meaningfully reviews ten thousand generated
  or agent-written lines. Review is the bottleneck of AI-assisted
  development, and the model is the reviewable artifact. This is the
  LLM-era form of the "explicit architecture" benefit the studies
  documented.
- **Multi-target consistency is structural.** Schema, server types,
  client types, and documentation cannot drift when they share one
  source. No agent diligence provides this; the guarantee is
  architectural.
- **Regeneration is free.** New target, changed style, revised model:
  zero marginal inference, against per-revision agent cost otherwise.
- **Context locality.** An agent working against a small model instead of
  the generated mass carries thousands rather than millions of input
  tokens across a long project. This compounds and is the real token
  economy, ahead of any markup saving.
- **Validation asymmetry.** Models are checkable against metamodels;
  hand-written output is not checkable against anything comparable. LLM
  mistakes land where they are detectable.

The adoption lesson attaches here too: MDE stuck where it enabled
otherwise-impossible business. The honest pitch for LLM-plus-MDE is not
"the same development, cheaper", it is workflows that pure agents cannot
offer at all: guaranteed-consistent multi-target generation, and bulk
output whose correctness a human can actually vouch for by reviewing the
model and the generator once.

## 6. The economics threshold, corrected

v1 claimed only large organisations could amortise a metamodel. The data
disagrees: 52 percent of the surveyed practitioners were in development
organisations under 100 people, and 19 percent over 1000. Narrow DSLs are
built in weeks, not quarters. What predicts success is not headcount but
domain shape: companies focused on a particular domain succeed, generic
software shops mostly do not. And everyday practice confirms the
threshold is low, since solo developers run narrow model-driven
generators daily (protobuf, OpenAPI clients, ORM schemas) without anyone
calling it MDE.

The corrected threshold: **repetition within the domain, times number of
generation targets, times expected lifetime, weighed against the cost of
authoring one metamodel and its transformations on a platform that
already exists.** Synthesis is the platform; that cost is sunk. LLMs
shrink the authoring term further. By this measure a solo developer with
one long-lived schema feeding five targets is well above the line, and a
large company building a one-off feature is below it. Size does not enter.

The v1 claim "a metamodel serving one project is usually not worth it"
falls with it: one model feeding many targets is volume, with an instance
count of one.

## 7. The long-document case

The same stack applies beyond code: a semantic model (novel, contract,
manual) transformed to a presentation document model and rendered to PDF,
Word, or Markdown; the architecture is in
[document-generation.md](document-generation.md). The economics here are
argued from mechanism, not literature, and are marked accordingly in the
references document:

- **Weakest argument: markup tokens.** Prose costs what prose costs;
  JSX wrapping can even cost more than Markdown. Keep the vocabulary
  terse.
- **Strongest: context locality.** Scene-by-scene generation against an
  addressable outline instead of re-reading a growing manuscript turns a
  quadratic input bill into a linear one.
- **Second: regeneration.** Formats and stylings at zero marginal
  inference, versus per-format regeneration.
- **Lead with correctness anyway.** Numbering, cross-references, tables
  of contents: LLMs do these badly at length; deterministic rendering
  does them perfectly. The token saving is a bonus.

Energy consumption tracks tokens, so the environmental claim is exactly
as strong as the token claim: modest for one-shot generation, substantial
for the revision and re-render loops.

## 8. Risks and honest limits

- **The generatable fraction is bounded, and unknown in advance.** The
  evidence is qualitative: MDE generates key parts, not whole systems;
  low-level code that the design does not capture does not get generated;
  one company's lasting insight from MDE was precisely the split between
  simple generated parts and complex hand-written ones. v1's percentage
  was invented; the honest statement is "measure it per domain."
- **Generated code quality can bite downstream.** In one certification
  context, unreadable generated code raised certification costs by a
  factor of eight. Generation quality is part of the deliverable, not an
  internal detail.
- **Keep domains tight and narrow.** The strongest practitioner guidance
  in the literature, and the discipline against the
  specification-is-just-code trap: a model as expressive as code is code,
  and the gain evaporates. Declared variation through the configuration
  framework (issues and options resolved by a configuration model) is how
  Synthesis keeps the escape hatch principled instead of hand-editing
  generated files.
- **Scale-up is where projects die.** Grassroots success followed by an
  organisation-wide mandate is the documented failure point. For
  Synthesis this counsels growing through working examples, not through
  process mandates.
- **LLMs are worse at long structured output than at prose**, and their
  transformation code is error-prone out of the box. Budget for the
  validate-and-repair loop; the typed gate is what makes it converge.
- **Metamodels rot.** They are software with a maintenance cost, which
  the threshold formula must include on the cost side.
- **The research base for the central bet is thin**, per section 4, and
  industry involvement in it is limited so far.

## 9. How to test the thesis

Pick one domain with genuine repetition, model it, and measure against an
agent doing the same work directly:

1. **Total tokens**, including metamodel and transformation authoring,
   not just the generation runs.
2. **The generatable fraction**, measured after the hand-written
   remainder is finished, not estimated before.
3. **Human review time.** The number that will decide it, and the one
   nobody measures.

Working hypotheses to calibrate, not findings: below roughly a third
generatable, the metamodel likely does not pay; above half, with several
targets, the case should be strong and strengthen with every
regeneration. Replace these numbers with measured ones at the first
opportunity.

## Summary of positions

| Question | Position | Evidence status |
| --- | --- | --- |
| Did MDE fail? | No. The heavyweight whole-system vision stalled; narrow domain-specific practice is widespread and won. | Supported |
| What blocked MDE? | Organizational and social factors at least as much as technical; tooling; then the dual-skill scarcity. | Supported |
| Is it big-company-only? | No. Majority of surveyed practitioners were in sub-100 development organisations; domain shape decides, not size. | Supported |
| What do LLMs change? | They supply the scarce language-engineering half of the dual skill set; they do not fix organizational or tooling factors. | Partially supported plus reasoning |
| Best LLM role? | Author the metamodel and transformations, not the bulk output. | Open research bet |
| Biggest practical win? | Collapse of the human review surface; the modern form of the documented explicit-architecture benefit. | Reasoning, adjacent support |
| Sell it as faster and cheaper? | No. Measured codegen productivity gains are modest and offset; sell what agents cannot do at all. | Supported |
| Long-text token win? | Context locality, then regeneration; not markup. | Reasoning |
| What would falsify it? | Measured generatable fraction too low, or review time that does not drop. Thresholds are working hypotheses. | To be measured |
