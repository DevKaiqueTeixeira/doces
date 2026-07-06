<script setup lang="ts">
import { createElement } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { onBeforeUnmount, onMounted, ref } from 'vue'

import { ReactWidget } from '../react/ReactWidget'

const host = ref<HTMLDivElement | null>(null)
let root: Root | null = null

onMounted(() => {
  if (!host.value) {
    return
  }

  root = createRoot(host.value)
  root.render(createElement(ReactWidget))
})

onBeforeUnmount(() => {
  root?.unmount()
  root = null
})
</script>

<template>
  <div ref="host" class="react-host"></div>
</template>
