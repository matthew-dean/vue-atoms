import { defineComponent, h, computed, ref, type Ref, type InjectionKey } from 'vue'
import { atom, inject, provide } from '../src'
import { mount } from '@vue/test-utils'

describe('Tests', () => {
  describe('Atom tests', () => {
    const myAtom = atom(ref(0))
    it('injects a default value into a component', () => {
      const component = defineComponent(
        () => {
          const atm = inject(myAtom)
          return () => <div>{ atm.value }</div>
        }
      )
      const wrapper = mount(component)
      expect(wrapper.html()).toBe('<div>0</div>')
    })

    it('provides a parent value', () => {
      const Child = defineComponent(
        () => {
          const atm = inject(myAtom)
          return () => <div>{ atm.value }</div>
        }
      )
      const Parent = defineComponent(
        () => {
          const atm = inject(myAtom)
          const newValue = computed(() => atm.value + 1)
          provide(myAtom, newValue)
          return () => <div>{ atm.value }<Child /></div>
        }
      )
      const wrapper = mount(Parent)
      expect(wrapper.html()).toBe('<div>0<div>1</div>\n</div>')
    })

    it('can be provided in mount options', () => {
      const component = defineComponent(
        () => {
          const atm = inject(myAtom)
          return () => <div>{ atm.value }</div>
        }
      )
      const wrapper = mount(component, {
        global: {
          provide: {
            [myAtom]: ref(1)
          }
        }
      })
      expect(wrapper.html()).toBe('<div>1</div>')
    })
  })

  describe('Fallback tests - it can be used like regular inject / provide', () => {
    it('can use a string key and regular primitive', () => {
      const GrandParent = defineComponent(
        () => {
          provide('test', 0)
          return () => <Parent />
        }
      )
      const Parent = defineComponent(
        () => {
          const atm = inject('test')
          provide('test', 1)
          return () => <div>{ atm }<Child /></div>
        }
      )
      const Child = defineComponent(
        () => {
          const atm = inject('test')
          return () => <div>{ atm }</div>
        }
      )
      const wrapper = mount(GrandParent)
      expect(wrapper.html()).toBe('<div>0<div>1</div>\n</div>')
    })

    it('can use a symbol key', () => {
      const testSymbol = Symbol('test')
      const GrandParent = defineComponent(
        () => {
          provide(testSymbol, 0)
          return () => <Parent />
        }
      )
      const Parent = defineComponent(
        () => {
          const atm = inject(testSymbol)
          provide(testSymbol, 1)
          return () => <div>{ atm }<Child /></div>
        }
      )
      const Child = defineComponent(
        () => {
          const atm = inject(testSymbol)
          return () => <div>{ atm }</div>
        }
      )
      const wrapper = mount(GrandParent)
      expect(wrapper.html()).toBe('<div>0<div>1</div>\n</div>')
    })

    it('uses symbol + ref', () => {
      const testSymbol = Symbol('test')
      const GrandParent = defineComponent(
        () => {
          provide(testSymbol, ref(0))
          return () => <Parent />
        }
      )
      const Parent = defineComponent(
        () => {
          const atm = inject(testSymbol) as Ref<number>
          provide(testSymbol, ref(1))
          return () => <div>{ atm.value }<Child /></div>
        }
      )
      const Child = defineComponent(
        () => {
          const atm = inject(testSymbol) as Ref<number>
          return () => <div>{ atm.value }</div>
        }
      )
      const wrapper = mount(GrandParent)
      expect(wrapper.html()).toBe('<div>0<div>1</div>\n</div>')
    })

    it('uses symbol + InjectionKey', () => {
      const testSymbol = Symbol('test') as InjectionKey<Ref<number>>
      const GrandParent = defineComponent(
        () => {
          provide(testSymbol, ref(0))
          return () => <Parent />
        }
      )
      const Parent = defineComponent(
        () => {
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          const atm = inject(testSymbol)!
          provide(testSymbol, ref(1))
          return () => <div>{ atm.value }<Child /></div>
        }
      )
      const Child = defineComponent(
        () => {
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          const atm = inject(testSymbol)!
          return () => <div>{ atm.value }</div>
        }
      )
      const wrapper = mount(GrandParent)
      expect(wrapper.html()).toBe('<div>0<div>1</div>\n</div>')
    })
  })
})
