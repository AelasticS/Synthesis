# Function: createClass()

> **createClass**\<`P`\>(`objectType`, `store`): [`Class`](../type-aliases/Class.md)\<`P`\>

Defined in: [immutable/createClass.ts:50](https://github.com/AelasticS/Synthesis/blob/6c6b3794f59388098fda2e026d162eaf05abcfcb/libraries/aelastics-store/src/immutable/createClass.ts#L50)

Dynamically creates a class based on a given object type.
Initializes the class with properties and defines getter and setter methods for each property.
Handles the creation of inverse relationships between objects.

## Type Parameters

• **P** *extends* `ImmutableObject`

## Parameters

### objectType

`AnyObjectType`

The object type for which the class is being created.

### store

[`ImmutableStore`](../classes/ImmutableStore.md)\<`unknown`\>

## Returns

[`Class`](../type-aliases/Class.md)\<`P`\>

The dynamically created class based on the given object type.
