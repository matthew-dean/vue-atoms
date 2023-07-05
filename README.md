# vue-atoms

## Installation
```sh
npm install vue-atoms
```

## Usage
```ts
import { atom } from 'vue-atoms'

export const counterAtom = atom(0)
```
```vue
<script setup lang="ts">
import { inject } from 'vue-atoms'
import { counterAtom } from './atoms'

const counter = inject(counterAtom)
</script>

<template>
  <div>{{ counter }}</div>
  <button @click="counter++">Increment</button>
</template>
```

## Explanation
### A better type-safe `provide()` and `inject()` for Vue

The `provide()` and `inject()` Vue API is one of the more awkward parts, especially when it comes to TypeScript and type-safety.


