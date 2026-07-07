<template>
  <QHeader class="app-nav" elevated>
    <div class="app-nav__inner">
      <div class="app-nav__actions">
        <BaseButton
          label="Home"
          icon="home"
          :variant="active === 'home' ? 'solid' : 'ghost'"
          :full-width="false"
          @click="emit('navigate', 'home')"
        />

        <BaseButton
          label="Cadastrar produto"
          icon="inventory_2"
          :variant="active === 'produtos' ? 'solid' : 'ghost'"
          :full-width="false"
          @click="emit('navigate', 'produtos')"
        />

        <QBtn flat round icon="logout" aria-label="Sair" @click="emit('logout')" />
      </div>
    </div>
  </QHeader>
</template>

<script setup lang="ts">
import { QBtn, QHeader } from 'quasar'

import BaseButton from './base/BaseButton.vue'

defineProps<{
  active: 'home' | 'produtos'
}>()

const emit = defineEmits<{
  navigate: [target: 'home' | 'produtos']
  logout: []
}>()
</script>

<style scoped>
.app-nav {
  background: linear-gradient(135deg, #4c1d95 0%, #7c3aed 100%);
}

.app-nav__inner {
  min-height: 72px;
  padding: 12px 16px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.app-nav__actions {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  flex-wrap: wrap;
}

@media (max-width: 640px) {
  .app-nav__actions {
    display: grid;
    grid-template-columns: 1fr 1fr auto;
    gap: 8px;
    align-items: center;
  }
}
</style>
