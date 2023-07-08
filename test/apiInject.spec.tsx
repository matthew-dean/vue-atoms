/* eslint-disable @typescript-eslint/no-non-null-assertion, @typescript-eslint/ban-ts-comment */
/**
 * imported test from vue core tests
 *
 * @see https://raw.githubusercontent.com/vuejs/core/507f3e7a16c98398a661c150ce89d36b1441f6cc/packages/runtime-core/__tests__/apiInject.spec.ts
 */

import {
  provide,
  inject
} from '../src/index'

import {
  h,
  type InjectionKey,
  ref,
  nextTick,
  type Ref,
  readonly,
  reactive,
  defineComponent,
  hasInjectionContext
} from 'vue'

import { mount as originalMount } from '@vue/test-utils'

const App = defineComponent({
  template: '<div><slot /></div>'
})

const mount = (Component: any) => originalMount(<App>{ () => <Component /> }</App>, { attachTo: 'body' })

// reference: https://vue-composition-api-rfc.netlify.com/api.html#provide-inject
describe('api: provide/inject', () => {
  it('string keys', () => {
    const Provider = {
      setup() {
        provide('foo', 1)
        return () => h(Middle)
      }
    }

    const Middle = {
      render: () => h(Consumer)
    }

    const Consumer = {
      setup() {
        const foo = inject('foo')
        return () => foo
      }
    }

    const wrapper = mount(h(Provider))
    expect(wrapper.html()).toBe('<div>1</div>')
  })

  it('symbol keys', () => {
    // also verifies InjectionKey type sync
    const key: InjectionKey<number> = Symbol('injection')

    const Provider = {
      setup() {
        provide(key, 1)
        return () => h(Middle)
      }
    }

    const Middle = {
      render: () => h(Consumer)
    }

    const Consumer = {
      setup() {
        const foo = inject(key) ?? 1
        return () => foo + 1
      }
    }

    const wrapper = mount(h(Provider))
    expect(wrapper.html()).toBe('<div>2</div>')
  })

  it('default values', () => {
    const Provider = {
      setup() {
        provide('foo', 'foo')
        return () => h(Middle)
      }
    }

    const Middle = {
      render: () => h(Consumer)
    }

    const Consumer = {
      setup() {
        // default value should be ignored if value is provided
        const foo = inject('foo', 'fooDefault') as string
        // default value should be used if value is not provided
        const bar = inject('bar', 'bar') as string
        return () => foo + bar
      }
    }

    const wrapper = mount(h(Provider))
    expect(wrapper.html()).toBe('<div>foobar</div>')
  })

  it('bound to instance', () => {
    const Provider = {
      setup() {
        return () => h(Consumer)
      }
    }

    const Consumer = defineComponent({
      name: 'Consumer',
      inject: {
        foo: {
          from: 'foo',
          default() {
            return this!.$options.name
          }
        }
      },
      render() {
        return this.foo
      }
    })

    const wrapper = mount(h(Provider))
    expect(wrapper.html()).toBe('<div>Consumer</div>')
  })

  it('nested providers', () => {
    const ProviderOne = {
      setup() {
        provide('foo', 'foo')
        provide('bar', 'bar')
        return () => h(ProviderTwo)
      }
    }

    const ProviderTwo = {
      setup() {
        // override parent value
        provide('foo', 'fooOverride')
        provide('baz', 'baz')
        return () => h(Consumer)
      }
    }

    const Consumer = {
      setup() {
        const foo = inject('foo')
        const bar = inject('bar')
        const baz = inject('baz')
        return () => [foo, bar, baz].join(',')
      }
    }

    const wrapper = mount(h(ProviderOne))
    expect(wrapper.html()).toBe('<div>fooOverride,bar,baz</div>')
  })

  it('reactivity with refs', async () => {
    const count = ref(1)

    const Provider = {
      setup() {
        provide('count', count)
        return () => h(Middle)
      }
    }

    const Middle = {
      render: () => h(Consumer)
    }

    const Consumer = {
      setup() {
        const count = inject<Ref<number>>('count')!
        return () => count.value
      }
    }

    const wrapper = mount(h(Provider))
    expect(wrapper.html()).toBe('<div>1</div>')

    count.value++
    await nextTick()
    expect(wrapper.html()).toBe('<div>2</div>')
  })

  it('reactivity with readonly refs', async () => {
    const count = ref(1)

    const Provider = {
      setup() {
        provide('count', readonly(count))
        return () => h(Middle)
      }
    }

    const Middle = {
      render: () => h(Consumer)
    }

    const Consumer = {
      setup() {
        const count = inject<Ref<number>>('count')!
        // should not work
        count.value++
        return () => count.value
      }
    }

    const wrapper = mount(h(Provider))
    expect(wrapper.html()).toBe('<div>1</div>')

    // Figure out expecting warnings, but presuming this works
    // expect(
    //   'Set operation on key "value" failed: target is readonly'
    // ).toHaveBeenWarned()

    // source mutation should still work
    count.value++
    await nextTick()
    expect(wrapper.html()).toBe('<div>2</div>')
  })

  it('reactivity with objects', async () => {
    const rootState = reactive({ count: 1 })

    const Provider = {
      setup() {
        provide('state', rootState)
        return () => h(Middle)
      }
    }

    const Middle = {
      render: () => h(Consumer)
    }

    const Consumer = {
      setup() {
        const state = inject<typeof rootState>('state')!
        return () => state.count
      }
    }

    const wrapper = mount(h(Provider))
    expect(wrapper.html()).toBe('<div>1</div>')

    rootState.count++
    await nextTick()
    expect(wrapper.html()).toBe('<div>2</div>')
  })

  it('reactivity with readonly objects', async () => {
    const rootState = reactive({ count: 1 })

    const Provider = {
      setup() {
        provide('state', readonly(rootState))
        return () => h(Middle)
      }
    }

    const Middle = {
      render: () => h(Consumer)
    }

    const Consumer = {
      setup() {
        const state = inject<typeof rootState>('state')!
        // should not work
        state.count++
        return () => state.count
      }
    }

    const wrapper = mount(h(Provider))
    expect(wrapper.html()).toBe('<div>1</div>')

    // Figure out expecting warnings, but presuming this works
    // expect(
    //   'Set operation on key "count" failed: target is readonly'
    // ).toHaveBeenWarned()

    rootState.count++
    await nextTick()
    expect(wrapper.html()).toBe('<div>2</div>')
  })

  it('should warn unfound', () => {
    const Provider = {
      setup() {
        return () => h(Middle)
      }
    }

    const Middle = {
      render: () => h(Consumer)
    }

    const Consumer = {
      setup() {
        const foo = inject('foo')
        expect(foo).toBeUndefined()
        return () => foo
      }
    }

    const wrapper = mount(h(Provider))
    expect(wrapper.html()).toBe('<div>\n  <!---->\n</div>')
    // Figure out expecting warnings, but presuming this works
    // expect('injection "foo" not found.').toHaveBeenWarned()
  })

  // it('should not warn when default value is undefined', () => {
  //   const Provider = {
  //     setup() {
  //       return () => h(Middle)
  //     }
  //   }

  //   const Middle = {
  //     render: () => h(Consumer)
  //   }

  //   const Consumer = {
  //     setup() {
  //       const foo = inject('foo', undefined)
  //       return () => foo
  //     }
  //   }

  //   const wrapper = mount(h(Provider))
  //   // Figure out expecting warnings, but presuming this works
  //   expect('injection "foo" not found.').not.toHaveBeenWarned()
  // })

  // #2400
  // Fix later
  it.skip('should not self-inject', () => {
    const Comp = defineComponent(
      () => {
        provide('foo', 'foo')
        const injection = inject('foo', null)
        return () => <div>{injection}</div>
      }
    )

    const wrapper = mount(Comp)
    expect(wrapper.html()).toBe('<div><!----></div>')
  })

  describe('hasInjectionContext', () => {
    it('should be false outside of setup', () => {
      expect(hasInjectionContext()).toBe(false)
    })

    it('should be true within setup', () => {
      expect.assertions(1)
      const Comp = {
        setup() {
          expect(hasInjectionContext()).toBe(true)
          return () => null
        }
      }

      mount(h(Comp))
    })

    // it('should be true within app.runWithContext()', () => {
    //   expect.assertions(1)
    //   createApp({}).runWithContext(() => {
    //     expect(hasInjectionContext()).toBe(true)
    //   })
    // })
  })
})
