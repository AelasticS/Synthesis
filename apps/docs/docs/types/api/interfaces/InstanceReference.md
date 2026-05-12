# Interface: InstanceReference

Defined in: [type/TypeDefinisions.ts:51](https://github.com/AelasticS/Synthesis/blob/ba994ad7657b3e24dbf58012ff4677a4f0722af3/libraries/aelastics-types/src/type/TypeDefinisions.ts#L51)

ToDo: Conditional typing, Partial, DeepPartial, Pick, Omit,
 Generics types - with function with deepPartial which will replace all type place holders
 a step toward templates
 linkedList = generics (object("LinkedList", {info:param("ElemType"), next:link("LinkedList"))
 definition treeOf = generics(object({info:param("InfoType"), children:arrayOf(link("treeOf")),
 {InfoType: [extends, number]}
 }

 generics wildcards (? extends) and (? super)
 ))

## Properties

### category

> **category**: `string`

Defined in: [type/TypeDefinisions.ts:53](https://github.com/AelasticS/Synthesis/blob/ba994ad7657b3e24dbf58012ff4677a4f0722af3/libraries/aelastics-types/src/type/TypeDefinisions.ts#L53)

***

### id

> **id**: `number`

Defined in: [type/TypeDefinisions.ts:52](https://github.com/AelasticS/Synthesis/blob/ba994ad7657b3e24dbf58012ff4677a4f0722af3/libraries/aelastics-types/src/type/TypeDefinisions.ts#L52)

***

### typeName

> **typeName**: `string`

Defined in: [type/TypeDefinisions.ts:54](https://github.com/AelasticS/Synthesis/blob/ba994ad7657b3e24dbf58012ff4677a4f0722af3/libraries/aelastics-types/src/type/TypeDefinisions.ts#L54)
