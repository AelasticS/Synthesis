# Claims and Evidence: LLMs and Model-Driven Engineering

> Companion to
> [llm-and-model-driven-engineering-v2.md](llm-and-model-driven-engineering-v2.md).
> It maps that document's claims to the sources that support, qualify, or
> contradict them, and it names the claims that have no source because
> they are our own reasoning. The superseded first draft is
> [llm-and-model-driven-engineering.md](llm-and-model-driven-engineering.md).

## Method and honesty notes

Searches were run on 2026-08-29. "Verified" is used at two levels and each
source below states which applies:

- **Read**: the text itself was read and quotes are taken from it.
- **Bibliographically verified**: existence, authors, venue, and year were
  confirmed against publisher or index pages; content is characterized
  from abstracts, index summaries, or search excerpts, not from a full
  read.

Two sources carry extra caveats. The Mohagheghi and Dehlen findings are
quoted from the authors' own conference presentation slides, not the paper
text. The Kelly and Tolvanen productivity figure is the claim of committed
advocates (the authors built the MetaEdit+ tool) and is listed as such,
not as independent measurement.

One deliberate limitation: this file cites what was checked, and where a
claim rests on our reasoning it says so instead of decorating the claim
with loosely related citations.

## A. Sources

**S1. Whittle, Hutchinson, Rouncefield, "The State of Practice in
Model-Driven Engineering", IEEE Software 31(3):79-85, 2014.** Read (author
preprint, [Lancaster EPrints](https://eprints.lancs.ac.uk/id/eprint/69765/1/SO_SW_2012_12_0188.R1_Whittle.pdf)).
Survey of 450 MDE practitioners plus 22 interviews across 17 companies in
9 sectors. The primary source for most empirical claims in v2.

**S2. Hutchinson, Whittle, Rouncefield, Kristoffersen, "Empirical
assessment of MDE in industry", ICSE 2011, pp. 471-480.**
Bibliographically verified ([ACM DL](https://dl.acm.org/doi/10.1145/1985793.1985858)).
The underlying study behind S1; questionnaire and interview methods
investigating technical, organizational and social factors.

**S3. Mohagheghi, Dehlen, "Where Is the Proof? A Review of Experiences
from Applying MDE in Industry", ECMDA-FA 2008, Springer LNCS 5095.**
Paper bibliographically verified
([Springer](https://link.springer.com/chapter/10.1007/978-3-540-69100-6_31));
findings quoted from the authors'
[presentation slides](https://pdfs.semanticscholar.org/e105/a5fc52ff9fc80fcedfc732ad1d5a38622639.pdf),
which were read. Systematic review, 33 papers identified, 25 reviewed,
covering 2000 to mid 2007.

**S4. Baker, Loh, Weil, "Model-Driven Engineering in a Large Industrial
Context: Motorola Case Study", MoDELS 2005, LNCS 3713.**
Bibliographically verified
([Springer](https://link.springer.com/chapter/10.1007/11557432_36)).
Reported dramatic quality, reliability, and productivity improvements;
named three deployment essentials: appropriate modeling language, powerful
domain-specific code generator, deployment support team. Its obstacles
(lack of a well-defined process, lack of necessary skills, inflexibility
of the existing culture) are quoted via S3's slides.

**S5. Thomas, "MDA: Revenge of the Modelers or UML Utopia?", IEEE
Software 21(3):15-17, 2004.** Bibliographically verified
([IEEE Xplore](https://ieeexplore.ieee.org/document/1293067/)). The
canonical contemporary skeptical piece on heavyweight MDA.

**S6. Selic, "The Pragmatics of Model-Driven Development", IEEE Software
20(5):19-25, 2003.** Bibliographically verified
([ACM DL](https://dl.acm.org/doi/10.1109/MS.2003.1231146)). The canonical
advocate statement of what MDD needs to deliver.

**S7. Kelly, Tolvanen, "Domain-Specific Modeling: Enabling Full Code
Generation", Wiley-IEEE, 2008.** Bibliographically verified
([book site](https://dsmbook.com/),
[Wiley](https://www.wiley.com/en-ae/Domain+Specific+Modeling:+Enabling+Full+Code+Generation-p-9780470249253)).
Advocate source claiming 500 to 1000 percent productivity gains for DSM
early adopters.

**S8. Hailpern, Tarr, "Model-driven development: the good, the bad, and
the ugly", IBM Systems Journal 45(3), 2006.** Bibliographically verified
([ACM DL](https://dl.acm.org/doi/10.1147/sj.453.0451)). Cited in v2 only
as part of the critical literature; its specific arguments were not
re-read and are not load-bearing.

**S9. Di Ruscio, Kolovos, de Lara, Pierantonio, Tisi, Wimmer, "Low-code
development and model-driven engineering: Two sides of the same coin?",
Software and Systems Modeling 21:437-446, 2022.** Bibliographically
verified ([Springer](https://link.springer.com/article/10.1007/s10270-021-00970-2)).
Examines the relationship between low-code platforms and MDE.

**S10. "Large language models in model-driven engineering: a systematic
mapping study", Empirical Software Engineering, 2026.** Bibliographically
verified ([Springer](https://link.springer.com/article/10.1007/s10664-026-10921-4));
author list not captured. 86 primary studies from 2022 to early 2026;
growth from 1 paper in 2022 to 42 in 2025; research concentrated on model
generation while model migration, DSL engineering, and metamodeling remain
marginal; limited industry involvement.

**S11. "On the use of large language models in model-driven engineering",
Software and Systems Modeling 24(3), 2025.** Existence verified
([ACM DL](https://dl.acm.org/doi/abs/10.1007/s10270-025-01263-8)); not
read; listed as an entry point to the LLM4MDE discussion.

**S12. "LLM4MTLs: Automated Generation and Empirical Evaluation of Model
Transformation Languages", arXiv, 2026.** Existence and abstract verified
([arXiv](https://arxiv.org/html/2606.25193)). Reports that out-of-the-box
prompting frequently produces transformation code with syntactic or
semantic errors.

## B. Claim-by-claim map

Statuses: **Supported** (verified source states it), **Partially
supported** (source supports part, our framing extends it),
**Corrected** (v1 claimed it, evidence contradicts it, v2 fixed it),
**Reasoning** (our argument, no source sought or found).

### B1. MDE use is widespread but rarely generates whole systems

**Supported** by S1: "MDE may be more widespread than commonly believed,
but developers rarely use it to generate whole systems; rather, they
apply it to develop key parts of a system often using domain-specific
modeling languages developed specifically for the purpose." S3 agrees on
partial generation: some papers generate all or most code (2 examples),
others only part; "low-level code is not captured in the design and is
unlikely to be generated."

### B2. "MDE failed" (v1)

**Corrected.** S1 refutes the plain form ("some form of MDE is practised
widely"); S4 documents a major success; S9 shows the approach thriving
commercially as low-code. What stalled is the heavyweight whole-system
MDA vision that S5 criticized when it was current. v2 states the split
explicitly.

### B3. Organizational and social factors weigh at least as much as technical ones

**Supported** by S1: "social and organizational factors are at least as
important in determining success as technical ones"; top-down mandates
struggle; middle managers are a bottleneck; "Most Projects Fail at
Scale-Up"; adoption sticks when MDE "can enable business that otherwise
would not be possible." S2 is the underlying study.

### B4. The dual-skill scarcity

**Supported as one factor** by S1: "MDE developers need both compiler
development skills and abstraction skills," usually taught separately;
one company's largest bottleneck was retraining hundreds of coders for
abstract thinking; "success is less likely when a team has a division of
skills between domain experts and MDE experts." S3/S4 add Motorola's
"lack of necessary skills." v1's error was ranking this as the central
barrier; the sources rank it among several (see B3, B5).

### B5. Tooling as a first-order barrier

**Supported** by S3 (tool availability "the most influential factor" in
adoption decisions; third-party tools that do not scale) and S1 (over 40
languages and 100 tools in regular use, no consensus, "state-of-the-art
modeling techniques and tools do a poor job of supporting software
development activities").

### B6. "Only big companies can amortise it" (v1)

**Corrected.** S1's sample spread: "52%<100 and 19%>1000" people in
development. DSLs with generators built "sometimes in as little as two
weeks." The success predictor S1 reports is domain focus versus generic
software, not size. The ubiquity of narrow generators at solo scale
(protobuf, OpenAPI, ORM codegen) is offered as observable practice, not
cited literature.

### B7. Metamodel authoring is enormously expensive (v1, implicit)

**Corrected in its strong form.** S1: practical domain modeling is
"quick and dirty," two-week DSLs for narrow domains. The expensive thing
is building a modeling *platform*, which for Synthesis is sunk cost. The
platform/instance cost split is our framing (Reasoning).

### B8. The 30 to 40 percent generatable fraction (v1)

**Corrected: the number was invented.** The bounded-fraction point
survives qualitatively via B1's sources. v2 replaces the figure with
"measure it per domain."

### B9. Measured productivity effects of code generation

**Supported** by S1: reports range "from a 27% loss to an 800% gain,"
most companies 20 to 30 percent; "MDE brings with it increased training
costs and substantial organizational change that easily offset 20-30%
productivity increases"; "code generation is a red herring when it comes
to describing MDE." S7 claims 500 to 1000 percent (advocate source). S4
reports dramatic gains in a supported deployment. The spread itself is
the finding: outcomes depend on deployment quality, and modest gains do
not carry adoption.

### B10. The durable benefit is the explicit, reviewable artifact

**Partially supported.** S1 locates MDE's main advantage in "the support
that MDE provides in documenting a good software architecture," with
interviewees unanimous that MDE forces explicit architectures, and
describes a company whose generated/hand-written split became its
architectural insight. v2's "review surface collapse" is our LLM-era
restatement of that finding (Reasoning on top of S1).

### B11. LLMs supply the language-engineering half of the dual skill set

**Reasoning, anchored on B4's supported scarcity.** No source measures
LLM-assisted metamodel authoring by domain experts. S10 confirms DSL
engineering and metamodeling are *marginal* topics in current LLM4MDE
research, so this is an open bet, and v2 says so. S12 cautions that
LLM-generated transformation code is error-prone out of the box, which
motivates the typed validation gate.

### B12. LLMs raised the ROI threshold for building generators

**Reasoning.** Our argument; no source sought.

### B13. Context locality, regeneration economics, long-document token arithmetic

**Reasoning.** Mechanical arguments from how context windows and
regeneration work; no literature consulted. The energy claim inherits
exactly the strength of the token claim.

### B14. Multi-target consistency, validation asymmetry

**Reasoning**, consistent with B10's evidence but not separately sourced.

### B15. Keep domains tight and narrow; escape-hatch discipline

**Supported** by S1 (tip one: "MDE works best when used to automate
software engineering tasks in very narrow, tight domains"; the anecdote of
developers hacking a mandated tool and hand-editing generated code) and
S1's certification case ("code certification costs rose by a factor of
eight" from unreadable generated code). The configuration-based answer
(declared variation via issues and options) is our design (Reasoning).

### B16. Low-code as MDE's commercial descendant

**Supported with nuance** by S9, which examines rather than asserts the
equation; v2 phrases it as a debated close relationship.

### B17. The empirical base itself is thin in places

**Supported** by S3: of 25 reviewed papers, only 7 reported completed
projects, most gave no project size, and only one appeared in a journal.
Conclusions built on this literature, including ours, should be held
accordingly.

## C. The v1 to v2 audit trail

| v1 claim | Verdict | v2 replacement |
| --- | --- | --- |
| "Model-driven engineering failed" | Overstated (B2) | Heavyweight vision stalled; narrow domain-specific practice won |
| Rare expertise as the central barrier | Selective (B3, B4, B5) | One factor; organizational, social, and tooling factors rank at least as high |
| Big organisations only | Contradicted (B6) | Domain shape and target count decide; size does not enter |
| 30 to 40 percent generatable | Invented (B8) | Qualitative bound; measure per domain |

## D. Not verified, held from background knowledge

- Domain-level success stories as commonly narrated (AUTOSAR in
  automotive, Simulink in control systems): consistent with S1's sector
  list and general knowledge, but no specific source was checked in this
  pass.
- The characterization of S5, S6, and S8 beyond their existence: their
  roles as skeptic, advocate, and critic are as remembered; none was
  re-read.
- S2's companion paper ("Model-driven engineering practices in industry",
  ICSE 2011, pp. 633-642): seen in search results, not independently
  confirmed.

Anything promoted from this section into an argument should be verified
first.
