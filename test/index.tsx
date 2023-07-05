import { defineComponent, h } from 'vue'
import { atom, inject, provide } from '../src'
import { mount } from '@vue/test-utils'

describe('test', () => {
  const myAtom = atom(0)
  test('injects a default value into a component', () => {
    const component = defineComponent(
      () => {
        const atm = inject(myAtom)
        return () => <div>{ atm.value }</div>
      }
    )
    const wrapper = mount(component)
    expect(wrapper.html()).toBe('<div>0</div>')
  })

  test('provides a parent value', () => {
    const Child = defineComponent(
      () => {
        const atm = inject(myAtom)
        return () => <div>{ atm.value }</div>
      }
    )
    const Parent = defineComponent(
      () => {
        provide(myAtom, 1)
        return () => <Child />
      }
    )
    const wrapper = mount(Parent)
    expect(wrapper.html()).toBe('<div>1</div>')
  })
})
