import { createApp } from 'vue'
import App from './App.vue'

import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import useComponent from './useComponent'

createApp(App).use(ElementPlus).use(useComponent).mount('#app')
