import {
  type Ref,
  type UnwrapRef,
  type InjectionKey,
  ref,
  provide as originalProvide,
  inject as originalInject
} from 'vue'

/**
 * This uses a WeakMap where it is valid, and falls back to a Map.
 * To do so, we need to trick TypeScript into thinking that we're
 * only using a Map, as it doesn't support WeakMap using symbol keys.
 */
class Store<T = any> {
  #supportsWeakMap: boolean
  #store: Map<symbol, T>

  constructor() {
    try {
      const wm = new WeakMap()
      // eslint-disable-next-line symbol-description
      wm.set(Symbol() as unknown as object, 0)
      this.#supportsWeakMap = true
      this.#store = wm as unknown as Map<symbol, T>
    } catch (e) {
      this.#supportsWeakMap = false
      this.#store = new Map()
    }
  }

  set(key: symbol, value: T) {
    this.#store.set(key, value)
  }

  get(key: symbol) {
    return this.#store.get(key)
  }

  has(key: symbol) {
    return this.#store.has(key)
  }

  delete(key: symbol) {
    this.#store.delete(key)
  }
}

const store = new Store()

interface AtomTrait { __type: 'atom' }
type Atom<T = any> = symbol & AtomTrait & InjectionKey<Ref<UnwrapRef<T>>>
type AtomType<T> = T extends Atom<infer V> ? V : never

export const atom = <T>(initialValue: T) => {
  const sym = Symbol() // eslint-disable-line symbol-description
  store.set(sym, ref(initialValue))
  return sym as Atom<T>
}

const isAtom = <T>(key: Atom<T> | InjectionKey<T> | string): key is Atom<T> => {
  return typeof key !== 'string'
}

export function inject<U = unknown, T extends Atom | InjectionKey<any> | string = string>(
  key: T
): T extends Atom ? Ref<AtomType<T>> : U | undefined {
  const unique = Symbol.for('unique-injection')
  if (isAtom(key)) {
    const tryValue: any = originalInject(key, unique)
    if (tryValue !== undefined && tryValue !== unique) {
      return ref(tryValue)
    }
    return store.get(key)
  } else {
    return originalInject(key)
  }
}

export function provide<T, K extends Atom | InjectionKey<any> | string = string>(
  key: K,
  value: K extends Atom ? AtomType<K> | Ref<AtomType<K>> : T
): void {
  if (isAtom(key)) {
    /** Create a new atom with the same type */
    const val = atom(value)
    originalProvide(key, store.get(val))
  } else {
    originalProvide(key, value as any)
  }
}

/** Type-restricted functions */
export const injectAtom = <T extends Atom>(atm: T) => inject(atm)
export const provideAtom = <T extends Atom>(
  atm: T,
  value: AtomType<T>
) => {
  provide(atm, value)
}
