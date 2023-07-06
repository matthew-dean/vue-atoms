# vue-atoms

_Note: This is pre-1.0 so feedback welcome. Right now, this is designed as a drop-in, type-safe replacement to `provide()` and `inject()`. Should the functions have different names?_

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
### The Problem with `provide()` and `inject()`

The `provide()` and `inject()` Vue API is one of the more awkward parts, especially when it comes to TypeScript and type-safety.

To get proper types (sort of), Vue asks you to do a few things.

1. Use a symbol as a key.
2. Type your symbol as `InjectionKey<{type}>`

This looks like:
```ts
import { provide } from 'vue'
export const key = Symbol() as InjectionKey<string>
provide(key, 'foo')
```
When consuming the value, to get the type, you then do:
```ts
import { inject } from 'vue'
import { key } from './injection-keys'

const foo = inject(key)
```

**This causes a number of side-effects / problems.**

For one, the value of `foo` is not guaranteed, meaning that the value is always returned as `T | undefined` even if you gave an explicit type for `T`. Vue tells you to workaround this by using `as` again like:
```ts
const foo = inject(key) as string
```

This can lead to unexpected runtime errors in your code, because `as` essentially circumvents any type-checking. Meaning, the official Vue documentation for typing provide / inject is both [an abuse of the type system](https://github.com/microsoft/TypeScript/issues/54885#issuecomment-1620688284), and represents poor TypeScript practices.

Furthermore, because Vue is abusing the type system, your symbol key is no longer recognized as a symbol. This can lead to type errors when using Vue Test Utils, like so:
```ts
mount(MyComponent, {
  global: {
    provide: {
      // Throws TypeScript error: "A computed property name must be of type 'string', 'number', 'symbol', or 'any'"
      [key]: 'value'
    }
  }
})
```

### A better type-safe `provide()` and `inject()` for Vue

Inspired by [React Context](https://react.dev/learn/passing-data-deeply-with-context) and [Jotai](https://jotai.org/), `vue-atoms` creates small pieces of state called "atoms", which have a default value, and are typed either implicitly by the value, or by an explicit type.

First, you create an atom:
```ts
import { atom } from 'vue-atoms'

export const counterAtom = atom(0)
```
In your Vue component, you inject the value like you normally would. However, the atom does not need an explicit provider, and if one isn't found, will use the default value.
```vue
<script setup lang="ts">
import { inject } from 'vue-atoms'
import { counterAtom } from './atoms'

// type is Ref<number> with a value of `0`
const counter = inject(counterAtom)
</script>

<template>
  <div>{{ counter }}</div>
  <button @click="counter++">Increment</button>
</template>
```
If you wish to provide a new value for part of the component tree, you can do so like the following:
```vue
<script setup lang="ts">
import { provide } from 'vue-atoms'
import { counterAtom } from './atoms'

// The value for `provide` is type-checked to be of the same type as your atom.
provide(counterAtom, 100)
</script>

<template>
  <Consumer />
</template>
```
You can also compute values from atoms to provide for deeper consumers:
```vue
<script setup lang="ts">
import { inject, provide } from 'vue-atoms'
import { computed } from 'vue'
import { counterAtom } from './atoms'

const counter = inject(counterAtom)
const computedCounter = computed(() => counter.value + 10)
provide(counterAtom, computedCounter)
</script>
```

### Atoms are symbols!

This will now work:
```ts
// ... test
mount(MyComponent, {
  global: {
    provide: {
      [counterAtom]: 10
    }
  }
})
```

## Demo

See: https://stackblitz.com/edit/vitejs-vite-baobw8?file=src%2FApp.vue