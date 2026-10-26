---
sidebar_position: 2
---

# 2. Specialization

The metamodel now distinguishes kernel entities from weak ones. This
page is the mechanism that lets the transformation act on that
distinction without ever asking which kind of entity it has.

Two decorators do the work, both from `@aelastics/synthesis/m2m`:

- **`@SpecPoint()`** marks a rule as a specialization point. The rule
  keeps its body and its meaning, and becomes dispatchable.
- **`@SpecOption(baseMethodName, Type)`** registers another method as
  the specialized rule to use when the specialization point named by
  `baseMethodName` is called with an element of `Type`.

In the companion package that is three methods, whose bodies page 3
fills in:

```tsx
  @E2E()
  @SpecPoint()
  entityToTable(e: em.IEntity): ExprNode<rmT.ITable> { ... }

  @SpecOption('entityToTable', em.Kernel)
  kernelToTable(k: em.IKernel): ExprNode<rmT.ITable> { ... }

  @SpecOption('entityToTable', em.Weak)
  weakToTable(w: em.IWeak): ExprNode<rmT.ITable> { ... }
```

The base method is named by string, and the source type by the
metamodel's type object, `em.Kernel` and `em.Weak` from the `/model`
subpath. That is the same type object the store compares against in
`isTypeOf`, and the same one the source model was rendered with, which
is what Part 1's point about metamodels having to be importable
packages was protecting.

Nothing else in the class refers to `kernelToTable` or `weakToTable`.
The template calls `entityToTable`, as it did in Part 1, and the two
options are reached only through the dispatch.

## Two things the build needs

**Decorators must be enabled.** Add one line to the package's
`tsconfig.json`:

```json
    "experimentalDecorators": true
```

Without it the decorators are a compile error, and it is the only
difference between Part 1's `tsconfig.json` and Part 2's.

**The import list grows.** The m2m import picks up the three
decorators the class uses:

```tsx
import { abstractM2M, E2E, SpecPoint, SpecOption } from '@aelastics/synthesis/m2m'
```

## Decorator order is not a matter of taste

`@E2E()` has to be written above `@SpecPoint()`, so that `@E2E` is the
outer decorator and `@SpecPoint` the inner one.

`@E2E` is the tracing decorator: it records that a rule ran, on which
source element, and producing which target elements. Applied outside a
specialization point, it sees the result the dispatch actually produced
and records one rule invocation for it: its `function` is the option
that was selected (for example `weakToTable`), with the source element
and the target elements the merged result created. Applied inside, it would
see only the base rule's result, and the trace would report a table
that never existed in that form.

The framework does not leave this to chance. The order is checked when
the class is decorated, at load time, and the wrong order throws before
a single element is transformed:

```text
@SpecPoint on "entityToTable" cannot be combined with @E2E.
Valid: @SpecPoint alone, or @E2E above @SpecPoint.
```

`@SpecOption` takes no companion decorator at all. Placing `@E2E` above
an option would trace the same source element twice, so the guard
rejects that too.

`@E2E` itself is optional. Drop it and the specialization still
dispatches and still merges; you simply lose the trace entry for that
rule. Part 2's companion keeps it, because a rule whose behaviour
depends on the input is exactly the kind of rule worth having in a
trace.

## The semantics, in four rules

Everything about how a specialization point behaves follows from four
facts. They are worth reading closely, because two of them surprise
people who expect the mechanism to behave like method overriding.

### 1. The base rule always runs

A specialization point is not an abstract declaration that options
implement. It is a real rule with a real body, and calling
`entityToTable` runs it every time, for every entity, whichever option
is selected afterwards.

Its result becomes the abstract parent of the pair: the option's result
is attached to it as its specialization, and it is the option's element
that is created in the target model, carrying what the base rule
contributed. So the base rule is where everything common belongs, and
an option that has nothing to add is a legitimate option.

### 2. Merging: the option overrides props and appends children

The two results are combined by two rules, and both directions matter:

- **Props.** The base rule's props are applied first and the option's
  props are applied over them. An option that sets a prop the base rule
  also set wins; an option that says nothing about a prop keeps the
  base rule's value.
- **Children.** The option's children are appended after the base
  rule's children. Nothing is replaced, and the order is fixed: base
  first, option second.

Read the consequence carefully. **An option can add children and it can
override properties of the element the base rule produced, but it
cannot reach into a child the base rule already emitted.** In this
transformation, `weakToTable` can add a column to the table and could
rename the table, but it could not change the `isKey` flag on the
column that `entityToTable` produced for `copyNumber`. If a rule needs
that kind of control, the property belongs on the base rule, computed
from the source element, rather than in an option.

The upside of the same rules is that options stay small. They declare
what is different and nothing else, which is why `kernelToTable`'s
whole body is an empty `<Table />`.

### 3. Selection takes the most specific applicable option

When the point is called, the engine reads the runtime type of the
source element from the store. An option is applicable when that
runtime type is the option's declared type or a subtype of it, and
among the applicable options the most specific one is selected.

In this transformation every entity's runtime type is exactly one of
the declared option types, so exactly one option applies: a `BookCopy`
is a `Weak`, so `weakToTable` applies and `kernelToTable` does not. Had
the class an option for `Entity` as well, it would apply to every
entity, and `kernelToTable` and `weakToTable` would still win for
kernel and weak entities, because they are more specific. Declaration
order plays no role, just as with method overriding. Two options for
the same type could never be told apart, so the second one is rejected
when the class is decorated.

### 4. Dispatch is total: no match is an error

If no registered option matches, the dispatch throws:

```text
No specialized method found
```

There is no fallback to the base rule on its own. The options have to
cover every type the rule can receive, and if a plain `Entity` can
reach the rule, then a plain `Entity` needs an option of its own.

This is the reason the companion package declares `kernelToTable` even
though a kernel entity's table is exactly the skeleton the base rule
already built. Deleting the option because its body is empty does not
make kernel entities fall back to the base rule; it makes every kernel
entity a failed run. Page 3 shows what that failure looks like.

## What specialization is for, and what it is not for

The entity rule was a good candidate because the choice it makes is
already made in the source model. `BookCopy` is a `Weak`, the model
says so, and the transformation should not be able to decide otherwise.
Encoding that as dispatch on the source type says precisely that: the
model decides, the code obeys.

The relationship rule is not a candidate, and Part 2 leaves it alone.
Whether a 1:N relationship becomes a foreign key or a join table is not
determined by the source model, and there is no subtype to dispatch on.
Making one up (a `ForeignKeyRelationship` subtype, say) would smuggle a
target-side design decision into the source metamodel, where it would
be stated once and for all rather than chosen per project. Part 3
handles that case with a configuration-based rule instead.

The rule of thumb: dispatch on the source type when the source model
already answers the question, and use a configuration when it does not.

## Further reading

The [polymorphic rule dispatch guide](../../../guides/polymorphic-dispatch.md)
is the reference treatment of `@SpecPoint` and `@SpecOption`, including
the deeper-hierarchy cases this tutorial does not reach.

## Next

You know what the decorators do. [The refactor](./3-the-refactor.md)
applies them to Part 1's code and runs the result.
