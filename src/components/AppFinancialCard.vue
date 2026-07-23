<template>
  <div class="app-financial-card" :class="toneClass">
    <small>{{ label }}</small>
    <strong>{{ value }}</strong>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    label: string
    value: string
    tone?: 'default' | 'success' | 'open'
  }>(),
  {
    tone: 'default',
  },
)

const toneClass = computed(() => `app-financial-card--${props.tone}`)
</script>

<style scoped>
.app-financial-card {
  min-width: 0;
  display: grid;
  gap: 4px;
  padding: 10px;
  border-radius: 14px;
  background: rgba(124, 58, 237, 0.05);
}

.app-financial-card small {
  color: var(--app-text-muted, #968daa);
  font-size: 0.68rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  text-align: center;
}

.app-financial-card strong {
  color: var(--app-title, #170f26);
  font-size: 0.9rem;
  font-weight: 800;
  line-height: 1.2;
  text-align: center;
}

.app-financial-card--success {
  background: rgba(34, 197, 94, 0.1);
}

.app-financial-card--success strong {
  color: #166534;
}

.app-financial-card--open {
  background: rgba(245, 158, 11, 0.14);
}

.app-financial-card--open strong {
  color: #c2410c;
}
</style>
