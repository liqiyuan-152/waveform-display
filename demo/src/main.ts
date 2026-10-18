import { createApp } from 'vue'
import App from './App.vue'
import 'ant-design-vue/dist/reset.css'
import './styles.css'

const app = createApp(App)
app.mount('#app')
if (import.meta.hot) import.meta.hot.dispose(() => app.unmount())
