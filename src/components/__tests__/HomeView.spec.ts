import { describe, it, expect } from 'vitest'

import { mount } from '@vue/test-utils'
import Template from './Template.vue'

describe('Template', () => {
  it.skip('renders properly', () => {
    const wrapper = mount(Template, {
      props: { msg: 'Piano Note Accuracy Exercises' },
    })
    expect(wrapper.text()).toContain('Piano Note Accuracy Exercises')
  })
})
