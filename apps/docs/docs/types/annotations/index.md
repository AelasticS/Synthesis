---
sidebar_position: 0
title: Annotations
---

Annotations attach typed metadata to type definitions. They are separate from a
type's value constraints — constraints say what values are valid, annotations say
something additional about the type itself that is useful in other contexts.

Common uses include UI rendering hints (labels, placeholders, display order),
persistence mappings (column names, table names), serialization configuration,
and documentation metadata. Because annotations are themselves typed using the
same type system, the compiler checks that annotation values match the shape
defined by the annotation schema.

Annotations are processed using the graph transducer pipeline, so they can be
read during the same traversal pass that performs validation or DTO conversion.
