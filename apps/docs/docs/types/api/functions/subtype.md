# Function: subtype()

> **subtype**\<`P`, `S`, `I`\>(`superType`, `extraProps`, `name`, `schema`): [`Subtype`](../classes/Subtype.md)\<`P`, `S`, [`ObjectType`](../classes/ObjectType.md)\<`InterfaceDecl`, `I`\>\>

Defined in: [common/DefinitionAPI.ts:56](https://github.com/AelasticS/Synthesis/blob/ba994ad7657b3e24dbf58012ff4677a4f0722af3/libraries/aelastics-types/src/common/DefinitionAPI.ts#L56)

## Type Parameters

• **P** *extends* `InterfaceDecl`

• **S** *extends* `InterfaceDecl`

• **I** *extends* readonly `string`[]

## Parameters

### superType

[`ObjectType`](../classes/ObjectType.md)\<`S`, `I`\>

### extraProps

`P`

### name

`string` = `...`

### schema

[`TypeSchema`](../classes/TypeSchema.md) = `DefaultSchema`

## Returns

[`Subtype`](../classes/Subtype.md)\<`P`, `S`, [`ObjectType`](../classes/ObjectType.md)\<`InterfaceDecl`, `I`\>\>
