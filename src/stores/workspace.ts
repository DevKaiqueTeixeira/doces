import { computed, ref } from 'vue'
import { defineStore } from 'pinia'

import { getSupabasePublicEnv, hasSupabasePublicConfig } from '../lib/supabase'
import { apiUrl } from '../services/api'

const phases = [
  {
    title: 'Vue como shell principal',
    description: 'Quasar monta a interface base e Pinia organiza o estado compartilhado.',
  },
  {
    title: 'React como ilha interna',
    description: 'Um widget React fica embutido no app para voce experimentar os dois ecossistemas.',
  },
  {
    title: 'Node.js com Supabase',
    description: 'A API separa credenciais e concentracao das chamadas ao banco e autenticacao.',
  },
] as const

const stack = ['Vue 3', 'Quasar', 'Pinia', 'React', 'TypeScript', 'Node.js', 'Supabase']

type ApiStatus = 'idle' | 'loading' | 'online' | 'offline'

export const useWorkspaceStore = defineStore('workspace', () => {
  const phaseIndex = ref(0)
  const apiStatus = ref<ApiStatus>('idle')
  const apiMessage = ref('Clique em verificar API para testar o backend local.')
  const supabaseStatus = ref<ApiStatus>('idle')
  const supabaseMessage = ref('Clique em verificar Supabase para validar a configuracao publica.')

  const currentPhase = computed(() => phases[phaseIndex.value])

  function nextPhase() {
    phaseIndex.value = (phaseIndex.value + 1) % phases.length
  }

  async function checkApi() {
    apiStatus.value = 'loading'

    try {
      const response = await fetch(`${apiUrl}/health`)

      if (!response.ok) {
        throw new Error('A API respondeu com erro.')
      }

      const payload = (await response.json()) as { service: string; status: string }

      apiStatus.value = 'online'
      apiMessage.value = `${payload.service} respondeu com status ${payload.status}.`
    } catch (error) {
      apiStatus.value = 'offline'
      apiMessage.value = error instanceof Error ? error.message : 'Nao foi possivel conectar na API.'
    }
  }

  async function checkSupabase() {
    supabaseStatus.value = 'loading'

    if (!hasSupabasePublicConfig()) {
      supabaseStatus.value = 'offline'
      supabaseMessage.value = 'As variaveis publicas do Supabase nao foram encontradas.'
      return
    }

    try {
      const { supabasePublishableKey, supabaseUrl } = getSupabasePublicEnv()
      const response = await fetch(`${supabaseUrl}/auth/v1/settings`, {
        headers: {
          apikey: supabasePublishableKey,
        },
      })

      if (!response.ok) {
        throw new Error('Nao foi possivel validar a configuracao publica do Supabase.')
      }

      supabaseStatus.value = 'online'
      supabaseMessage.value = 'Supabase publico configurado e acessivel pelo frontend.'
    } catch (error) {
      supabaseStatus.value = 'offline'
      supabaseMessage.value =
        error instanceof Error ? error.message : 'Falha ao validar o Supabase publico.'
    }
  }

  return {
    apiMessage,
    apiStatus,
    checkSupabase,
    currentPhase,
    phaseIndex,
    phases,
    stack,
    supabaseMessage,
    supabaseStatus,
    checkApi,
    nextPhase,
  }
})
