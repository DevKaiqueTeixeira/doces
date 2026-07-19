<template>
  <QBtn
    class="base-button"
    :class="buttonClassName"
    :label="label"
    :type="type"
    :icon="icon"
    :icon-right="iconRight"
    :loading="loading"
    :disable="disabled"
    :color="buttonColor"
    :text-color="buttonTextColor"
    :flat="variant === 'ghost'"
    :unelevated="variant !== 'ghost'"
    no-caps
  />
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { QBtn } from 'quasar'

const props = withDefaults(
  defineProps<{
    label: string
    type?: 'button' | 'submit' | 'reset'
    icon?: string
    iconRight?: string
    loading?: boolean
    disabled?: boolean
    color?: string
    variant?: 'solid' | 'ghost' | 'danger' | 'success'
    fullWidth?: boolean
    compact?: boolean
  }>(),
  {
    type: 'button',
    icon: '',
    iconRight: '',
    loading: false,
    disabled: false,
    color: 'primary',
    variant: 'solid',
    fullWidth: true,
    compact: false,
  },
)

const buttonClassName = computed(() => ({
  'base-button--full': props.fullWidth,
  'base-button--ghost': props.variant === 'ghost',
  'base-button--danger': props.variant === 'danger',
  'base-button--success': props.variant === 'success',
  'base-button--compact': props.compact,
}))

const buttonColor = computed(() => {
  if (props.variant === 'ghost') {
    return 'white'
  }

  if (props.variant === 'danger') {
    return 'negative'
  }

  if (props.variant === 'success') {
    return 'positive'
  }

  return props.color
})

const buttonTextColor = computed(() => {
  if (props.variant === 'ghost') {
    return 'primary'
  }

  return 'white'
})
</script>

<style scoped>
.base-button {
  min-height: 54px;
  padding-inline: 18px;
  border-radius: 18px;
  border: 1px solid transparent;
  font-family: var(--app-font-sans, Inter, system-ui, sans-serif);
  font-size: 0.96rem;
  font-weight: 700;
  letter-spacing: -0.01em;
  line-height: 1;
  box-shadow: var(--app-shadow-sm);
  transition: transform 0.2s ease, box-shadow 0.2s ease, filter 0.2s ease, border-color 0.2s ease;
}

.base-button--full {
  width: 100%;
}

.base-button--compact {
  min-height: 42px;
  padding-inline: 14px;
  border-radius: 14px;
  font-size: 0.86rem;
  letter-spacing: 0;
}

.base-button:not(.base-button--ghost):not(.base-button--danger) {
  background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 58%, #6d28d9 100%);
  box-shadow: 0 16px 32px rgba(124, 58, 237, 0.24);
}

.base-button--ghost {
  border-color: var(--app-border, rgba(124, 58, 237, 0.12));
  background: rgba(255, 255, 255, 0.86);
  box-shadow: none;
}

.base-button--danger {
  background: linear-gradient(135deg, #fb7185 0%, #e11d48 100%);
  box-shadow: 0 16px 30px rgba(225, 29, 72, 0.2);
}

.base-button--success {
  background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
  box-shadow: 0 16px 30px rgba(22, 163, 74, 0.22);
}

.base-button:hover:not(.disabled) {
  transform: translateY(-1px);
  box-shadow: 0 18px 34px rgba(124, 58, 237, 0.22);
  filter: brightness(1.03);
}

.base-button:focus-visible {
  outline: 2px solid rgba(124, 58, 237, 0.22);
  outline-offset: 3px;
}

.base-button.disabled {
  box-shadow: none;
  filter: saturate(0.9);
}

.base-button:deep(.q-icon) {
  font-size: 1rem;
}

.base-button:deep(.q-btn__content) {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
}

.base-button:deep(.q-btn__content .block) {
  display: inline-flex;
  align-items: center;
  line-height: 1;
}

.base-button:deep(.q-btn__content .on-left) {
  margin-left: 0;
  margin-right: 0;
  align-self: center;
}

.base-button:deep(.q-btn__content .on-right) {
  margin-left: 0;
  margin-right: 0;
  align-self: center;
}

@media (max-width: 640px) {
  .base-button {
    font-size: 0.92rem;
  }

  .base-button--compact {
    min-height: 40px;
    font-size: 0.82rem;
  }
}
</style>
