<template>
  <QInput
    :model-value="modelValue"
    outlined
    stack-label
    :label="label"
    :type="currentType"
    :autocomplete="autocomplete"
    :color="color"
    :bg-color="bgColor"
    :placeholder="placeholder"
    :disable="disabled"
    input-class="base-input__field"
    lazy-rules="ondemand"
    :rules="rules"
    class="base-input"
    @update:model-value="emit('update:modelValue', String($event ?? ''))"
  >
    <template v-if="icon" #prepend>
      <QIcon :name="icon" color="primary" />
    </template>

    <template v-if="isPassword" #append>
      <QIcon
        :name="showPassword ? 'visibility_off' : 'visibility'"
        color="primary"
        class="base-input__action"
        @click="showPassword = !showPassword"
      />
    </template>
  </QInput>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { QIcon, QInput } from 'quasar'

type InputRule = (value: string | number | null | undefined) => boolean | string
type InputType =
  | 'date'
  | 'datetime-local'
  | 'email'
  | 'file'
  | 'number'
  | 'password'
  | 'search'
  | 'tel'
  | 'text'
  | 'textarea'
  | 'time'
  | 'url'

const props = withDefaults(
  defineProps<{
    modelValue: string
    type?: InputType
    label: string
    icon?: string
    placeholder?: string
    autocomplete?: string
    rules?: InputRule[]
    disabled?: boolean
    color?: string
    bgColor?: string
  }>(),
  {
    type: 'text',
    icon: '',
    placeholder: '',
    autocomplete: 'off',
    rules: () => [],
    disabled: false,
    color: 'primary',
    bgColor: 'white',
  },
)

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const showPassword = ref(false)

const isPassword = computed(() => props.type === 'password')

const currentType = computed(() => {
  if (!isPassword.value) {
    return props.type
  }

  return showPassword.value ? 'text' : 'password'
})
</script>

<style scoped>
.base-input {
  width: 100%;
  font-family: var(--app-font-sans, Inter, system-ui, sans-serif);
}

.base-input__field {
  color: var(--app-text, #271d39);
  font-weight: 600;
  font-family: var(--app-font-sans, Inter, system-ui, sans-serif);
}

.base-input__action {
  cursor: pointer;
  transition: transform 0.2s ease, opacity 0.2s ease;
}

.base-input__action:hover {
  transform: scale(1.06);
  opacity: 0.8;
}

.base-input:deep(.q-field__control) {
  border-radius: 20px;
  min-height: 60px;
  background: rgba(255, 255, 255, 0.98);
  box-shadow: var(--app-shadow-sm);
}

.base-input:deep(.q-field--outlined .q-field__control::before) {
  border: 1px solid var(--app-border-strong, rgba(124, 58, 237, 0.24));
}

.base-input:deep(.q-field--outlined .q-field__control::after) {
  display: none;
}

.base-input:deep(.q-field--focused .q-field__control) {
  box-shadow: 0 0 0 4px var(--app-ring, rgba(124, 58, 237, 0.14));
}

.base-input:deep(.q-field--focused.q-field--outlined .q-field__control::before) {
  border-color: rgba(124, 58, 237, 0.38);
}

.base-input:deep(.q-field--error .q-field__control::before) {
  border-color: rgba(225, 29, 72, 0.42);
}

.base-input:deep(.q-field__control-container) {
  height: 100%;
}

.base-input:deep(.q-field__marginal) {
  height: 60px;
  align-items: center;
}

.base-input:deep(.q-field__native),
.base-input:deep(.q-field__input) {
  min-height: 100%;
  color: var(--app-text, #271d39);
  font-size: 0.96rem;
  font-weight: 600;
}

.base-input:deep(.q-field--stack-label .q-field__native),
.base-input:deep(.q-field--stack-label .q-field__input) {
  padding-top: 12px;
}

.base-input:deep(.q-field__label) {
  color: var(--app-text-muted, #968daa);
  font-size: 0.76rem;
  font-weight: 600;
  font-family: var(--app-font-sans, Inter, system-ui, sans-serif);
  letter-spacing: 0.02em;
}

.base-input:deep(.q-placeholder) {
  color: var(--app-text-muted, #968daa);
  opacity: 1;
  font-family: var(--app-font-sans, Inter, system-ui, sans-serif);
}

.base-input:deep(.q-field__prepend .q-icon),
.base-input:deep(.q-field__append .q-icon) {
  color: var(--app-primary, #7c3aed);
}
</style>
