# LLMs and Model-Driven Engineering: Where the Leverage Is

> Internal strategy documentation for contributors to Synthesis itself.
> A position paper, not a build plan. The concrete roadmap it motivates for
> document generation lives in
> [document-generation.md](document-generation.md).

## The thesis in one paragraph

Model-driven engineering did not fail because the idea was wrong. It failed
because building metamodels and transformations demanded rare expertise and
substantial time, so only large organisations with high-volume, stable
domains could amortise the cost. Large language models are unusually good
at exactly that authoring task. The interesting claim is therefore not
"use models instead of LLMs", but a division of labour:

**Let the LLM build the generator, not the output.**

The LLM writes the metamodel and the transformations once, reviewed
carefully because they are small and high-leverage. The LLM then drafts
models from natural language, which a human reviews cheaply. Deterministic
machinery produces the bulk artifact, free and consistent. The agent still
writes by hand the portion that is not generatable, because that portion is
real and will not disappear.

This is a hybrid, and the hybrid is stronger than either pure position. It
also inverts where expensive, careful human attention goes: onto a few
hundred lines of transformation rather than tens of thousands of lines of
output.

## 1. Why model-driven engineering stalled

Three failure modes, all of which still apply and none of which should be
waved away.

**The authoring barrier.** A metamodel plus its transformations is a
serious up-front investment requiring skills that are scarce. It pays back
only with volume, meaning many instances of the same shape. For a one-off
feature, writing the code directly has always been drastically cheaper.

**The 80/20 problem.** Most software is not schema-derived. For a
data-heavy CRUD system the generatable fraction might be 30 to 40 percent.
For anything with real business logic, algorithms, concurrency, interface
behaviour, performance work, or legacy integration it is much lower. A
generator produces 60 percent beautifully, and then the remaining 40
percent holds all the actual difficulty, now complicated by having to
interface with generated code.

**The escape hatch.** Every generator eventually meets a requirement it
cannot express. The historical answers were protected regions, partial
classes, hand-edited generated files, and round-tripping that never quite
worked. Generated and hand-written code interleave, regeneration becomes
dangerous, and the discipline collapses.

## 2. What LLMs change, and what they do not

**They demolish the authoring barrier.** Writing a transformation is a
well-specified, local, testable task, which is close to the ideal shape for
an agent. The cost that made model-driven engineering uneconomic for most
teams has dropped substantially. This is the strongest argument for the
approach and it is new.

**They make model authoring cheap for humans.** Drafting a model from a
natural-language description used to be tedious. Now the LLM drafts and the
human reviews two hundred lines instead of writing them.

**But they also raised the bar.** The classic argument for code generation
was that humans writing boilerplate is expensive and error-prone. LLMs made
boilerplate cheap. Not free, and not perfectly consistent, but cheap enough
that the return-on-investment threshold for building a metamodel moved
**up**, not down. Any honest version of this thesis has to clear the raised
bar rather than assume the old one.

## 3. Where the leverage actually is

### Leverage ratio

From one relational model: DDL, migrations, ORM entities, DTOs, validation
schemas, TypeScript types, an OpenAPI specification, a typed client, CRUD
handlers. Two hundred lines of model becoming ten thousand lines of code is
not unusual. An agent writing those ten thousand lines is slow, expensive,
and, worse, it **drifts**. The fortieth endpoint does not quite match the
third, because nothing forces it to. A generator emits all forty
identically by construction.

### Multi-target consistency becomes structural

Server types, client types, database schema, and documentation cannot fall
out of sync when they have one source. That is where hand-written and
LLM-written systems rot first, and no amount of agent diligence fixes it,
because the guarantee is architectural rather than behavioural.

### Change is cheap

Edit the model, regenerate. The alternative is finding and correctly
editing N scattered call sites, which is precisely the task agents are
least reliable at.

### The review surface collapses

This is the point to lead with. A human can genuinely review a two hundred
line model. Nobody meaningfully reviews ten thousand lines of generated
CRUD, and nobody meaningfully reviews ten thousand lines an agent wrote
either, though people pretend to.

Review is the actual bottleneck in AI-assisted development today, not
generation. Shrinking the artifact a human must understand by two orders of
magnitude is a larger win than any token saving, and it is the one that
compounds as teams generate more.

### Validation asymmetry

A model can be checked against its metamodel: typed, constraint-checked,
referentially complete. Asking "is this hand-written route handler correct"
is far harder. LLM output therefore lands in a space where mistakes are
**detectable** rather than latent, and repair can target the offending node
instead of regenerating everything.

### Context locality

An agent modifying a system reads a small model rather than fifty thousand
lines of generated code. This compounds over a project's life and is the
same argument that makes the approach attractive for long documents,
covered next.

## 4. The long-document case

The same stack applies outside code: a semantic model (a novel, a contract,
a manual) transformed to a presentation document model and rendered to PDF,
Word, or Markdown. See
[document-generation.md](document-generation.md) for the architecture.

The token economics deserve care, because the intuitive version of the
argument is the weakest one.

**Weakest: markup tokens on first generation.** A 100,000 word novel is
roughly 130,000 output tokens of prose no matter how it is encoded.
Dropping formatting markup saves the markup, not the words. And JSX is
*more* verbose per unit of content than Markdown: `<P>text</P>` costs more
than a bare line. A chatty schema can make first generation cost more, not
less. This argues for a deliberately terse vocabulary: short tag names,
attributes only where they carry meaning, prose as bare text children.

**Strongest: context locality.** For very long texts the cost is in input,
not output. Generating a hundred scenes while re-reading the whole
manuscript each time is quadratic, and it is what naive long-document
generation actually does. With an addressable model, an agent generates one
scene from the outline plus its neighbours, carrying a few thousand tokens
of context instead of a context growing toward the full text. Over a book
that is the difference between millions of input tokens and hundreds of
thousands. Prompt caching softens this today, but caching does not survive
revision the way structure does.

**Second strongest: regeneration.** With the model in hand, producing the
same book as PDF, EPUB, and Word costs zero additional inference, and
changing page size or heading style costs zero. Had the LLM produced
format-flavoured output directly, each of those is a regeneration. The cost
profile goes from O(formats x revisions) to O(1). The same holds for
editing: "rewrite scene 3 of chapter 7" touches one node instead of forcing
regeneration or fragile string surgery.

**And the argument to lead with is correctness, not cost.** Chapter
numbering, tables of contents, cross-references, consistent heading levels,
running heads: LLMs do these expensively *and* badly, because they drift
and miscount over long outputs. Deterministic code does them perfectly for
free. The token saving is a bonus on top of output that is actually right.

On energy: consumption tracks tokens fairly directly, so the environmental
argument is exactly as strong as the token argument. Modest for one-shot
generation, substantial for the context-locality and re-render loops. It is
a real benefit and should be claimed at that size, not larger.

## 5. Configuration-based transformation is the answer to the escape hatch

The historical failure mode described in section 1 is what happens when a
generator meets a requirement it cannot express, and the response is to
hand-edit generated output.

The decision framework in this repository is a principled alternative.
`@VarPoint` and `@VarOption` let variation be **declared** as issues and
options and resolved by a configuration model, so "the same model generates
different code for different situations" becomes a first-class, traceable,
reviewable concept rather than a patch in a generated file.

This is the mechanism that decides whether the approach scales past a demo.
It is the part of the design worth investing in hardest, because it is what
keeps regeneration safe, and regeneration being safe is what all the other
benefits depend on.

## 6. Risks and honest limits

**The generatable fraction is bounded.** Nothing here changes that. The
approach wins on the repetitive, structural, multi-target portion of a
system and is irrelevant to the rest. Claims should be scoped accordingly.

**The specification-is-just-code trap.** If the model becomes as expressive
as code, a programming language has been built and nothing was gained. The
value comes precisely from the model being *narrower* than code. The
discipline is to model only what is genuinely repetitive and structural,
and to resist the pull toward generality.

**LLMs are worse at long structured output than at prose.** Expect
unclosed tags, invented attributes, and schema drift, and budget tokens for
validation and repair. The typed store and metamodel validation are what
make this tractable, by turning drift into a hard failure at a known
location rather than a silent defect.

**Metamodel maintenance is a real cost.** Metamodels and transformations
are software and they rot. A metamodel serving one project is usually not
worth it. The economics need volume, whether across projects, across
targets, or across regenerations over time.

## 7. How to test the thesis

Pick one domain with genuine repetition, model it, and measure three things
honestly against an agent doing the same work directly:

1. **Total tokens**, including metamodel and transformation authoring, not
   just the generation run. Amortising authoring cost over one project is
   the standard way this analysis gets fudged.
2. **The generatable fraction**: what percentage of the final, working
   system the generator actually produced, measured after the hand-written
   remainder is finished rather than estimated before.
3. **Human review time**. This is the number that will decide it, and the
   one nobody measures.

Rough thresholds: below about a third generatable, the metamodel will not
pay for itself and the agent should simply write the code. Above half, and
especially where one model feeds several targets, the case is strong and
strengthens with every regeneration.

## Summary of positions

| Question | Position |
| --- | --- |
| Do models replace agents? | No. They divide labour: models for the structural part, agents for the rest. |
| What is the LLM's best role? | Authoring metamodels and transformations, not authoring output. |
| Biggest practical win? | Collapse of the human review surface. |
| Biggest token win for long text? | Context locality, then regeneration. Not markup. |
| Did LLMs strengthen the MDE case? | They removed its main barrier and simultaneously raised its ROI threshold. |
| What decides whether it scales? | Declared variation through configuration, instead of hand-edited output. |
| What would falsify it? | A generatable fraction below roughly a third, or review time that does not drop. |
