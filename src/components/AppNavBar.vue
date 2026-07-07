<template>
  <QHeader class="app-nav" elevated>
    <div class="app-nav__inner">
      <div class="app-nav__top">
        <div class="app-nav__links">
          <BaseButton
            label="Home"
            icon="home"
            :variant="active === 'home' ? 'solid' : 'ghost'"
            compact
            @click="emit('navigate', 'home')"
          />

          <BaseButton
            label="Produtos"
            icon="inventory_2"
            :variant="active === 'produtos' ? 'solid' : 'ghost'"
            compact
            @click="emit('navigate', 'produtos')"
          />

          <BaseButton
            label="Pedidos"
            icon="receipt_long"
            :variant="active === 'pedidos' ? 'solid' : 'ghost'"
            compact
            @click="emit('navigate', 'pedidos')"
          />
        </div>

        <div class="app-nav__utility">
          <QBtn flat round dense icon="logout" aria-label="Sair" class="app-nav__logout" @click="emit('logout')" />
        </div>
      </div>

      <div class="app-nav__progress-chip" aria-label="Resumo financeiro dos pedidos">
        <div class="app-nav__progress-track">
          <div class="app-nav__progress-fill app-nav__progress-fill--green" :style="receivedStyle"></div>
          <div class="app-nav__progress-fill app-nav__progress-fill--orange" :style="openStyle"></div>
        </div>

        <div class="app-nav__progress-values">
          <span class="app-nav__value app-nav__value--orange">{{ formatCurrency(openTotal) }}</span>
          <span class="app-nav__separator">/</span>
          <span class="app-nav__value app-nav__value--green">{{ formatCurrency(receivedTotal) }}</span>
        </div>
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
  background: linear-gradient(135deg, #4c1d95 0%, #7c3aed 100%);
}

.app-nav__inner {
  min-height: 94px;
  padding: 10px 12px;
  display: grid;
  gap: 10px;
}

.app-nav__top {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  gap: 8px;
}

.app-nav__links {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
  align-items: center;
  width: 100%;
  max-width: 420px;
  margin-inline: auto;
}

.app-nav__utility {
  display: flex;
  align-items: center;
  justify-content: flex-end;
}

.app-nav__progress-chip {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  min-height: 40px;
  padding: 0 14px;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.12);
  border: 1px solid rgba(255, 255, 255, 0.14);
}

.app-nav__progress-track {
  width: 72px;
  height: 6px;
  display: flex;
  overflow: hidden;
  flex: 0 0 auto;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.18);
}

.app-nav__progress-values {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  font-size: 0.68rem;
  font-weight: 800;
  line-height: 1;
  white-space: nowrap;
}

.app-nav__value {
  color: white;
}

.app-nav__value--orange {
  color: #fdba74;
}

.app-nav__value--green {
  color: #86efac;
}

.app-nav__separator {
  color: rgba(255, 255, 255, 0.56);
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

.app-nav__logout {
  color: white;
  flex: 0 0 auto;
}

.app-nav__links :deep(.base-button--compact) {
  min-height: 40px;
  padding-inline: 10px;
  border-radius: 12px;
  font-size: 0.84rem;
  letter-spacing: 0.02em;
  width: 100%;
}

.app-nav__links :deep(.base-button--compact .q-icon) {
  font-size: 1rem;
}

@media (max-width: 640px) {
  .app-nav__inner {
    min-height: 88px;
    padding: 8px 8px 10px;
    gap: 8px;
  }

  .app-nav__top {
    grid-template-columns: minmax(0, 1fr) auto;
    gap: 6px;
  }

  .app-nav__links {
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 6px;
    max-width: none;
  }

  .app-nav__utility {
    justify-content: center;
  }

  .app-nav__progress-chip {
    min-height: 38px;
    width: 100%;
    padding-inline: 12px;
    justify-content: center;
  }

  .app-nav__progress-track {
    width: 58px;
  }

  .app-nav__progress-values {
    font-size: 0.62rem;
  }

  .app-nav__links :deep(.base-button--compact) {
    min-height: 38px;
    padding-inline: 8px;
    font-size: 0.76rem;
  }
}
</style>
