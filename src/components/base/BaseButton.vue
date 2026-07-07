<template>
  <QBtn
    class="base-button"
    :label="label"
    :type="type"
    :icon-right="iconRight"
    :loading="loading"
    :disable="disabled"
    :color="color"
    text-color="white"
    unelevated
    no-caps
  />
</template>

<script setup lang="ts">
import { QBtn } from 'quasar'

withDefaults(
  defineProps<{
    label: string
    type?: 'button' | 'submit' | 'reset'
    iconRight?: string
    loading?: boolean
    disabled?: boolean
    color?: string
  }>(),
  {
    type: 'button',
    iconRight: '',
    loading: false,
    disabled: false,
    color: 'primary',
  },
)
</script>

<style scoped>
.base-button {
  width: 100%;
  min-height: 54px;
  border-radius: 18px;
  background: linear-gradient(135deg, #c084fc 0%, #9333ea 100%);
  font-size: 1rem;
  font-weight: 700;
  letter-spacing: 0.01em;
  transition: transform 0.2s ease, box-shadow 0.2s ease, filter 0.2s ease;
}

.base-button:hover:not(.disabled) {
  transform: translateY(-1px);
  box-shadow: 0 16px 30px rgba(147, 51, 234, 0.28);
  filter: brightness(1.03);
}

.base-button:focus-visible {
  outline: 2px solid rgba(147, 51, 234, 0.24);
  outline-offset: 3px;
}

.base-button:deep(.q-icon) {
  font-size: 1.1rem;
}
</style>
