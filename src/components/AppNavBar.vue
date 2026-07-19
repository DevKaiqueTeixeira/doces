<template>
  <QHeader class="app-nav" elevated>
    <div class="app-nav__inner app-page-shell">
      <div class="app-nav__brand" aria-label="Jessy Doces">
        <div class="app-nav__brand-mark">JD</div>

        <div class="app-nav__brand-copy">
          <span class="app-nav__brand-script">Jessy</span>
          <div class="app-nav__brand-meta">
            <strong>Jessy Doces</strong>
            <small>Painel interno</small>
          </div>
        </div>
      </div>

      <div class="app-nav__links">
        <BaseButton
          label="Home"
          icon="home"
          :variant="active === 'home' ? 'solid' : 'ghost'"
          :full-width="false"
          compact
          @click="emit('navigate', 'home')"
        />

        <BaseButton
          label="Produtos"
          icon="inventory_2"
          :variant="active === 'produtos' ? 'solid' : 'ghost'"
          :full-width="false"
          compact
          @click="emit('navigate', 'produtos')"
        />

        <BaseButton
          label="Pedidos"
          icon="receipt_long"
          :variant="active === 'pedidos' ? 'solid' : 'ghost'"
          :full-width="false"
          compact
          @click="emit('navigate', 'pedidos')"
        />
      </div>

      <div class="app-nav__utility">
        <div class="app-nav__progress-chip" aria-label="Resumo financeiro dos pedidos">
          <div class="app-nav__progress-copy">
            <span class="app-nav__progress-value app-nav__progress-value--open">{{ formatCurrency(openTotal) }}</span>
            <div class="app-nav__progress-track">
              <div class="app-nav__progress-fill app-nav__progress-fill--green" :style="receivedStyle"></div>
              <div class="app-nav__progress-fill app-nav__progress-fill--orange" :style="openStyle"></div>
            </div>
            <span class="app-nav__progress-value app-nav__progress-value--success">{{ formatCurrency(receivedTotal) }}</span>
          </div>

          <small class="app-nav__progress-total">Total {{ formatCurrency(totalAmount) }}</small>
        </div>

        <QBtn flat round dense icon="logout" aria-label="Sair" class="app-nav__logout" @click="emit('logout')" />
      </div>
    </div>
  </QHeader>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { QBtn, QHeader } from 'quasar'

import BaseButton from './base/BaseButton.vue'

const props = withDefaults(
  defineProps<{
    active: 'home' | 'produtos' | 'pedidos'
    openTotal?: number
    receivedTotal?: number
  }>(),
  {
    openTotal: 0,
    receivedTotal: 0,
  },
)

const emit = defineEmits<{
  navigate: [target: 'home' | 'produtos' | 'pedidos']
  logout: []
}>()

const totalAmount = computed(() => props.openTotal + props.receivedTotal)

const receivedStyle = computed(() => ({
  width: totalAmount.value > 0 ? `${(props.receivedTotal / totalAmount.value) * 100}%` : '0%',
}))

const openStyle = computed(() => ({
  width: totalAmount.value > 0 ? `${(props.openTotal / totalAmount.value) * 100}%` : '0%',
}))

function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}
</script>

<style scoped>
.app-nav {
  background: rgba(247, 245, 255, 0.78);
  border-bottom: 1px solid rgba(124, 58, 237, 0.08);
  backdrop-filter: blur(18px);
  box-shadow: none;
}

.app-nav__inner {
  min-height: 88px;
  padding: 14px 16px;
  display: grid;
  gap: 14px;
}

.app-nav__brand {
  display: flex;
  align-items: center;
  gap: 12px;
}

.app-nav__brand-mark {
  width: 46px;
  height: 46px;
  display: grid;
  place-items: center;
  border-radius: 16px;
  background: linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%);
  color: white;
  font-family: var(--app-font-display, Inter, system-ui, sans-serif);
  font-size: 0.98rem;
  font-weight: 700;
  letter-spacing: -0.04em;
  box-shadow: 0 16px 28px rgba(124, 58, 237, 0.2);
}

.app-nav__brand-copy {
  display: flex;
  align-items: center;
  gap: 10px;
}

.app-nav__brand-script {
  color: var(--app-primary-strong, #6d28d9);
  font-family: var(--app-font-script, cursive);
  font-size: 2.1rem;
  line-height: 0.8;
}

.app-nav__brand-meta {
  display: grid;
  gap: 2px;
}

.app-nav__brand-meta strong {
  color: var(--app-title, #170f26);
  font-family: var(--app-font-display, Inter, system-ui, sans-serif);
  font-size: 0.98rem;
  font-weight: 700;
  letter-spacing: -0.03em;
}

.app-nav__brand-meta small {
  color: var(--app-text-muted, #968daa);
  font-size: 0.78rem;
  font-weight: 600;
}

.app-nav__links {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
}

.app-nav__utility {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 10px;
}

.app-nav__progress-chip {
  flex: 1 1 auto;
  min-width: 0;
  display: grid;
  gap: 8px;
  padding: 12px 14px;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.78);
  border: 1px solid rgba(124, 58, 237, 0.08);
  box-shadow: var(--app-shadow-sm);
}

.app-nav__progress-copy {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: 10px;
}

.app-nav__progress-track {
  height: 8px;
  display: flex;
  overflow: hidden;
  border-radius: 999px;
  background: rgba(124, 58, 237, 0.08);
}

.app-nav__progress-fill {
  height: 100%;
}

.app-nav__progress-fill--green {
  background: linear-gradient(90deg, #22c55e 0%, #4ade80 100%);
}

.app-nav__progress-fill--orange {
  background: linear-gradient(90deg, #f59e0b 0%, #fb923c 100%);
}

.app-nav__progress-value {
  color: var(--app-title, #170f26);
  font-size: 0.82rem;
  font-weight: 700;
  white-space: nowrap;
}

.app-nav__progress-value--open {
  color: #c2410c;
}

.app-nav__progress-value--success {
  color: #166534;
}

.app-nav__progress-total {
  color: var(--app-text-muted, #968daa);
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

.app-nav__logout {
  width: 42px;
  height: 42px;
  color: var(--app-primary-strong, #6d28d9);
  background: rgba(255, 255, 255, 0.78);
  border: 1px solid rgba(124, 58, 237, 0.08);
  box-shadow: var(--app-shadow-sm);
  flex: 0 0 auto;
}

.app-nav__links :deep(.base-button--compact) {
  min-height: 40px;
  padding-inline: 14px;
  border-radius: 14px;
  font-size: 0.84rem;
  letter-spacing: 0;
  width: 100%;
}

.app-nav__links :deep(.base-button--compact .q-icon) {
  font-size: 1rem;
}

@media (min-width: 1080px) {
  .app-nav__inner {
    grid-template-columns: auto 1fr auto;
    align-items: center;
  }

  .app-nav__links {
    max-width: 440px;
    justify-self: center;
  }
}

@media (max-width: 1079px) {
  .app-nav__inner {
    padding: 12px 14px 14px;
  }

  .app-nav__brand {
    justify-content: center;
  }

  .app-nav__links {
    width: 100%;
  }

  .app-nav__utility {
    width: 100%;
  }
}

@media (max-width: 640px) {
  .app-nav__inner {
    padding: 12px 12px 14px;
    gap: 12px;
  }

  .app-nav__brand-copy {
    gap: 8px;
  }

  .app-nav__brand-script {
    font-size: 1.8rem;
  }

  .app-nav__brand-meta strong {
    font-size: 0.92rem;
  }

  .app-nav__brand-meta small {
    display: none;
  }

  .app-nav__links :deep(.base-button--compact) {
    min-height: 38px;
    padding-inline: 12px;
    font-size: 0.76rem;
  }

  .app-nav__progress-chip {
    padding: 10px 12px;
  }

  .app-nav__progress-copy {
    grid-template-columns: 1fr;
    gap: 8px;
  }

  .app-nav__progress-value,
  .app-nav__progress-total {
    text-align: center;
  }

  .app-nav__utility {
    align-items: stretch;
  }

  .app-nav__logout {
    align-self: center;
  }
}
</style>
