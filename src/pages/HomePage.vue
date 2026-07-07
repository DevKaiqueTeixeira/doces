<template>
  <QLayout view="lHh Lpr lFf" class="home-layout">
    <AppNavBar active="home" @navigate="handleNavigate" @logout="handleLogout" />

    <QPageContainer>
      <QPage class="home-page">
        <QCard flat class="home-card">
          <QCardSection class="home-card__content">
            <span class="home-card__eyebrow">Jessy Doces</span>
            <h1>Painel simples para gerenciar seus produtos.</h1>
            <p>Use a barra acima para abrir a area de cadastro e manutencao dos produtos.</p>

            <BaseButton
              label="Ir para cadastrar produto"
              icon="inventory_2"
              icon-right="east"
              :full-width="false"
              @click="handleNavigate('produtos')"
            />
          </QCardSection>
        </QCard>
      </QPage>
    </QPageContainer>
  </QLayout>
</template>

<script setup lang="ts">
import { QCard, QCardSection, QLayout, QPage, QPageContainer } from 'quasar'
import { useRouter } from 'vue-router'

import AppNavBar from '../components/AppNavBar.vue'
import BaseButton from '../components/base/BaseButton.vue'
import { useAuthStore } from '../stores/auth'

const authStore = useAuthStore()
const router = useRouter()

async function handleNavigate(target: 'home' | 'produtos') {
  await router.push(target === 'home' ? '/home' : '/produtos')
}

async function handleLogout() {
  authStore.logout()
  await router.replace('/login')
}
</script>

<style scoped>
.home-layout {
  background: linear-gradient(180deg, #f8f1ff 0%, #efe0ff 100%);
}

.home-page {
  padding: 18px;
  display: grid;
  place-items: center;
}

.home-card {
  width: min(100%, 520px);
  border-radius: 28px;
  background: rgba(255, 255, 255, 0.97);
  box-shadow: 0 22px 48px rgba(76, 29, 149, 0.12);
}

.home-card__content {
  min-height: calc(100vh - 170px);
  display: grid;
  align-content: center;
  justify-items: center;
  gap: 16px;
  text-align: center;
  padding: 34px 28px;
}

.home-card__eyebrow {
  display: inline-flex;
  color: #9333ea;
  font-size: 0.74rem;
  font-weight: 700;
  letter-spacing: 0.18em;
  text-transform: uppercase;
}

.home-card h1 {
  margin: 0;
  color: #3b0764;
  font-size: clamp(2rem, 7vw, 2.6rem);
  line-height: 1.05;
}

.home-card p {
  margin: 0;
  max-width: 320px;
  color: #6b21a8;
  line-height: 1.7;
}

@media (max-width: 640px) {
  .home-page {
    padding: 14px;
  }

  .home-card__content {
    min-height: calc(100vh - 158px);
    padding: 28px 20px;
  }
}
</style>
