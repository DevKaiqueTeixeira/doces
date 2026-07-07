<template>
  <QDialog :model-value="modelValue" persistent @update:model-value="emit('update:modelValue', $event)">
    <QCard flat class="confirm-dialog">
      <QCardSection class="confirm-dialog__content">
        <div class="confirm-dialog__icon-shell">
          <QIcon :name="icon" :color="iconColor" size="30px" />
        </div>

        <div class="confirm-dialog__copy">
          <h2 v-if="title">{{ title }}</h2>
          <p>{{ message }}</p>
        </div>
      </QCardSection>

      <QCardSection class="confirm-dialog__actions">
        <BaseButton
          :label="cancelLabel"
          variant="ghost"
          :disabled="loading"
          @click="emit('cancel')"
        />

        <BaseButton
          :label="confirmLabel"
          :variant="toneButtonVariant"
          :loading="loading"
          @click="emit('confirm')"
        />
      </QCardSection>
    </QCard>
  </QDialog>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { QCard, QCardSection, QDialog, QIcon } from 'quasar'

import BaseButton from './BaseButton.vue'

const props = withDefaults(
  defineProps<{
    modelValue: boolean
    title?: string
    message: string
    confirmLabel?: string
    cancelLabel?: string
    loading?: boolean
    tone?: 'primary' | 'danger' | 'success'
  }>(),
  {
    title: '',
    confirmLabel: 'Confirmar',
    cancelLabel: 'Cancelar',
    loading: false,
    tone: 'primary',
  },
)

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  confirm: []
  cancel: []
}>()

const icon = computed(() => {
  if (props.tone === 'danger') {
    return 'priority_high'
  }

  if (props.tone === 'success') {
    return 'task_alt'
  }

  return 'help_outline'
})

const iconColor = computed(() => {
  if (props.tone === 'danger') {
    return 'negative'
  }

  if (props.tone === 'success') {
    return 'positive'
  }

  return 'primary'
})

const toneButtonVariant = computed(() => {
  if (props.tone === 'danger') {
    return 'danger'
  }

  if (props.tone === 'success') {
    return 'success'
  }

  return 'solid'
})
</script>

<style scoped>
.confirm-dialog {
  width: min(100vw - 24px, 420px);
  border-radius: 26px;
  background: rgba(255, 255, 255, 0.98);
  box-shadow: 0 22px 48px rgba(76, 29, 149, 0.16);
}

.confirm-dialog__content {
  display: grid;
  gap: 16px;
  justify-items: center;
  text-align: center;
  padding: 28px 22px 12px;
}

.confirm-dialog__icon-shell {
  width: 56px;
  height: 56px;
  display: grid;
  place-items: center;
  border-radius: 50%;
  background: #f5edff;
}

.confirm-dialog__copy {
  display: grid;
  gap: 8px;
}

.confirm-dialog__copy h2 {
  margin: 0;
  color: #3b0764;
  font-size: 1.3rem;
}

.confirm-dialog__copy p {
  margin: 0;
  color: #6b21a8;
  line-height: 1.6;
}

.confirm-dialog__actions {
  display: grid;
  gap: 12px;
  padding: 10px 22px 24px;
}

@media (min-width: 640px) {
  .confirm-dialog__actions {
    grid-template-columns: 1fr 1fr;
  }
}
</style>
