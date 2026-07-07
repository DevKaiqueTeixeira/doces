<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import {
  QBtn,
  QCard,
  QCardSection,
  QChip,
  QLayout,
  QPage,
  QPageContainer,
  QSeparator,
} from 'quasar'
import { useRouter } from 'vue-router'

import ReactIsland from '../components/ReactIsland.vue'
import { useAuthStore } from '../stores/auth'
import { useWorkspaceStore } from '../stores/workspace'

const authStore = useAuthStore()
const workspaceStore = useWorkspaceStore()
const router = useRouter()

const { user } = storeToRefs(authStore)
const { apiMessage, apiStatus, currentPhase, phaseIndex, stack, supabaseMessage, supabaseStatus } =
  storeToRefs(workspaceStore)

const apiUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:3333'

const statusColor = computed(() => {
  if (apiStatus.value === 'online') {
    return 'positive'
  }

  if (apiStatus.value === 'loading') {
    return 'warning'
  }

  if (apiStatus.value === 'offline') {
    return 'negative'
  }

  return 'grey-6'
})

const statusLabel = computed(() => {
  if (apiStatus.value === 'online') {
    return 'API online'
  }

  if (apiStatus.value === 'loading') {
    return 'Verificando API'
  }

  if (apiStatus.value === 'offline') {
    return 'API offline'
  }

  return 'API pendente'
})

const supabaseColor = computed(() => {
  if (supabaseStatus.value === 'online') {
    return 'positive'
  }

  if (supabaseStatus.value === 'loading') {
    return 'warning'
  }

  if (supabaseStatus.value === 'offline') {
    return 'negative'
  }

  return 'grey-6'
})

const supabaseLabel = computed(() => {
  if (supabaseStatus.value === 'online') {
    return 'Supabase online'
  }

  if (supabaseStatus.value === 'loading') {
    return 'Verificando Supabase'
  }

  if (supabaseStatus.value === 'offline') {
    return 'Supabase offline'
  }

  return 'Supabase pendente'
})

async function handleLogout() {
  authStore.logout()
  await router.replace('/login')
}

onMounted(() => {
  void workspaceStore.checkApi()
  void workspaceStore.checkSupabase()
})
</script>

<template>
  <QLayout view="lHh Lpr lFf">
    <QPageContainer>
      <QPage class="page-shell">
        <section class="hero-panel dashboard-hero">
          <div>
            <span class="section-label">Painel autenticado</span>
            <h1>JESSYDOCES</h1>
            <p>
              Sessao local ativa para identificar quem movimentou pedidos, alterou status e gerou
              logs no painel.
            </p>
          </div>

          <div class="dashboard-hero__actions">
            <QChip color="primary" text-color="white">Usuario: {{ user?.nome }}</QChip>
            <QBtn color="primary" outline no-caps label="Sair" @click="handleLogout" />
          </div>

          <div class="chip-row">
            <QChip v-for="item in stack" :key="item" color="secondary" text-color="dark">
              {{ item }}
            </QChip>
          </div>
        </section>

        <section class="content-grid content-grid--triple">
          <QCard flat bordered class="overview-card">
            <QCardSection>
              <span class="section-label">Etapa atual</span>
              <h2>{{ currentPhase.title }}</h2>
              <p>{{ currentPhase.description }}</p>
            </QCardSection>

            <QSeparator dark />

            <QCardSection class="actions-row">
              <span>Passo {{ phaseIndex + 1 }} de 3</span>
              <QBtn color="primary" unelevated label="Proxima etapa" @click="workspaceStore.nextPhase" />
            </QCardSection>
          </QCard>

          <QCard flat bordered class="overview-card">
            <QCardSection>
              <span class="section-label">Backend local</span>
              <div class="status-row">
                <h2>{{ statusLabel }}</h2>
                <QChip :color="statusColor" text-color="white">{{ apiStatus }}</QChip>
              </div>
              <p>{{ apiMessage }}</p>
            </QCardSection>

            <QSeparator dark />

            <QCardSection class="actions-row">
              <span>Endpoint padrao: {{ apiUrl }}</span>
              <QBtn color="secondary" text-color="dark" unelevated label="Verificar API" @click="workspaceStore.checkApi" />
            </QCardSection>
          </QCard>

          <QCard flat bordered class="overview-card">
            <QCardSection>
              <span class="section-label">Supabase publico</span>
              <div class="status-row">
                <h2>{{ supabaseLabel }}</h2>
                <QChip :color="supabaseColor" text-color="white">{{ supabaseStatus }}</QChip>
              </div>
              <p>{{ supabaseMessage }}</p>
            </QCardSection>

            <QSeparator dark />

            <QCardSection class="actions-row">
              <span>Projeto: gczudwenlrrynxorpuyn</span>
              <QBtn
                color="accent"
                unelevated
                label="Verificar Supabase"
                @click="workspaceStore.checkSupabase"
              />
            </QCardSection>
          </QCard>
        </section>

        <section class="react-panel">
          <ReactIsland />
        </section>
      </QPage>
    </QPageContainer>
  </QLayout>
</template>

<style scoped>
.dashboard-hero {
  display: grid;
  gap: 22px;
}

.dashboard-hero__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: center;
  justify-content: space-between;
}

.dashboard-hero h1 {
  margin: 0 0 14px;
  color: #f8fafc;
}

.dashboard-hero p {
  margin: 0;
  max-width: 720px;
  color: #cbd5e1;
}

@media (max-width: 900px) {
  .dashboard-hero__actions {
    align-items: flex-start;
    justify-content: flex-start;
  }
}
</style>
