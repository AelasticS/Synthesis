# Function: compose()

> **compose**(...`fns`): (`x`) => `any`

Defined in: [transducers/Processor.ts:79](https://github.com/AelasticS/Synthesis/blob/ba994ad7657b3e24dbf58012ff4677a4f0722af3/libraries/aelastics-types/src/transducers/Processor.ts#L79)

Composes a sequence of functions into a single function.
Each function is passed the return value of the preceding function.

## Parameters

### fns

...(`y`) => `any`[]

An array of functions to compose.

## Returns

`Function`

A function that represents the composition of the input functions.

### Parameters

#### x

`any`

### Returns

`any`
