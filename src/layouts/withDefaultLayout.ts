import {
  defineComponent,
  h,
  type AsyncComponentLoader,
  type Component,
} from 'vue'
import DefaultLayout from './DefaultLayout.vue'

type ViewType = Component | AsyncComponentLoader

function wrap(view: Component) {
  return defineComponent({
    inheritAttrs: false,
    props: {
      header: String,
    },
    setup(props, { attrs }) {
      // header belongs to the layout only; forward any other attrs to the view
      // so header isn't passed down as an un-inheritable fallthrough attribute.
      return () =>
        h(DefaultLayout, { header: props.header }, {
          default: () => h(view, attrs),
        })
    },
  })
}

export function withLayout(view: ViewType) {
  const isAsyncLoader =
    typeof view === 'function' && !('then' in (view as AsyncComponentLoader))

  if (!isAsyncLoader) {
    return wrap(view as Component)
  }

  // Return an async ROUTE component (not defineAsyncComponent inside a sync
  // wrapper): the router then loads the actual view chunk before the
  // navigation confirms, so view transitions never animate an empty page.
  return async () => {
    const loaded = await (view as AsyncComponentLoader)()
    const component = (loaded as { default?: Component }).default ?? loaded
    return wrap(component as Component)
  }
}
