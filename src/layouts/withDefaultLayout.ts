import {
  defineAsyncComponent,
  defineComponent,
  h,
  type AsyncComponentLoader,
  type Component,
} from 'vue'
import DefaultLayout from './DefaultLayout.vue'

type ViewType = Component | AsyncComponentLoader

export function withLayout(view: ViewType) {
  const isAsyncLoader =
    typeof view === 'function' && !('then' in (view as AsyncComponentLoader))
  // If view is an async loader function, wrap it with defineAsyncComponent
  const AsyncView = isAsyncLoader
    ? defineAsyncComponent(view as AsyncComponentLoader)
    : view

  return defineComponent({
    props: {
      header: String,
    },
    setup(props) {
      return () =>
        h(DefaultLayout, props, {
          default: () => h(AsyncView, props),
        })
    },
  })
}
