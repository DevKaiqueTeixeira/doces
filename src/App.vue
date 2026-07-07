<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { QBtn, QCard, QCardSection, QChip, QLayout, QPage, QPageContainer, QSeparator } from 'quasar'

import ReactIsland from './components/ReactIsland.vue'
import { useWorkspaceStore } from './stores/workspace'

const workspaceStore = useWorkspaceStore()
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

onMounted(() => {
  void workspaceStore.checkApi()
  void workspaceStore.checkSupabase()
})
</script>

<template>
  <QLayout view="lHh Lpr lFf">
    <QPageContainer>
      <QPage class="page-shell">
        <section class="hero-panel">
          <span class="section-label">Projeto unico</span>
          <h1>Vue + Quasar + Pinia como base, com React no mesmo app</h1>
          <p>
            Voce abre apenas esta pasta no VS Code e trabalha em um unico projeto TypeScript com
            frontend Vue, um widget React embutido e backend Node.js com Supabase.
          </p>

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
