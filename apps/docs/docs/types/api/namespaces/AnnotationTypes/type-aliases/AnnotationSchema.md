# Type Alias: AnnotationSchema\<S, O, A, TU, R\>

> **AnnotationSchema**\<`S`, `O`, `A`, `TU`, `R`\>: `object`

Defined in: [annotations/Annotation.ts:32](https://github.com/AelasticS/Synthesis/blob/ba994ad7657b3e24dbf58012ff4677a4f0722af3/libraries/aelastics-types/src/annotations/Annotation.ts#L32)

## Type Parameters

• **S** *extends* [`AnyObjectType`](../../../type-aliases/AnyObjectType.md) \| [`AnySimpleType`](../../../type-aliases/AnySimpleType.md)

• **O** *extends* [`AnyObjectType`](../../../type-aliases/AnyObjectType.md)

• **A** *extends* [`AnyObjectType`](../../../type-aliases/AnyObjectType.md) = `O`

• **TU** *extends* [`AnyObjectType`](../../../type-aliases/AnyObjectType.md) = `O`

• **R** *extends* [`AnyObjectType`](../../../type-aliases/AnyObjectType.md) \| [`AnySimpleType`](../../../type-aliases/AnySimpleType.md) = `S`

## Type declaration

### arraySchema

> **arraySchema**: `A`

### objectSchema

> **objectSchema**: `O`

### refObjSchema

> **refObjSchema**: `R`

### simpleSchema

> **simpleSchema**: `S`

### taggedUnionSchema

> **taggedUnionSchema**: `TU`
