<template>
  <QInput
    :model-value="modelValue"
    outlined
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
  font-family: var(--login-sans-font, Inter, system-ui, sans-serif);
}

.base-input__field {
  color: #3b0764;
  font-weight: 600;
  font-family: var(--login-sans-font, Inter, system-ui, sans-serif);
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
  border-radius: 18px;
  min-height: 58px;
}

.base-input:deep(.q-field__control::before),
.base-input:deep(.q-field__control::after) {
  display: none;
}

.base-input:deep(.q-field__native),
.base-input:deep(.q-field__input) {
  padding-top: 18px;
}

.base-input:deep(.q-field__label) {
  color: #7e22ce;
  font-weight: 600;
  font-family: var(--login-sans-font, Inter, system-ui, sans-serif);
  letter-spacing: -0.01em;
}

.base-input:deep(.q-placeholder) {
  color: #a78bfa;
  opacity: 1;
  font-family: var(--login-sans-font, Inter, system-ui, sans-serif);
}
</style>
