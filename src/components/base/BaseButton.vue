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
    variant?: 'solid' | 'ghost' | 'danger'
    fullWidth?: boolean
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
  },
)

const buttonClassName = computed(() => ({
  'base-button--full': props.fullWidth,
  'base-button--ghost': props.variant === 'ghost',
  'base-button--danger': props.variant === 'danger',
}))

const buttonColor = computed(() => {
  if (props.variant === 'ghost') {
    return 'white'
  }

  if (props.variant === 'danger') {
    return 'negative'
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
  border-radius: 18px;
  font-family: var(--login-sans-font, Inter, system-ui, sans-serif);
  font-size: 0.98rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  line-height: 1;
  transition: transform 0.2s ease, box-shadow 0.2s ease, filter 0.2s ease;
}

.base-button--full {
  width: 100%;
}

.base-button:not(.base-button--ghost):not(.base-button--danger) {
  background: linear-gradient(135deg, #c084fc 0%, #9333ea 100%);
}

.base-button--ghost {
  border: 1px solid rgba(147, 51, 234, 0.2);
  background: rgba(255, 255, 255, 0.78);
}

.base-button--danger {
  background: linear-gradient(135deg, #fb7185 0%, #e11d48 100%);
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
    letter-spacing: 0.04em;
  }
}
</style>
