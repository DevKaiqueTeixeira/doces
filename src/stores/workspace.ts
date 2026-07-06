import { computed, ref } from 'vue'
import { defineStore } from 'pinia'

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

  const currentPhase = computed(() => phases[phaseIndex.value])

  function nextPhase() {
    phaseIndex.value = (phaseIndex.value + 1) % phases.length
  }

  async function checkApi() {
    apiStatus.value = 'loading'

    try {
      const baseUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:3333'
      const response = await fetch(`${baseUrl}/health`)

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

  return {
    apiMessage,
    apiStatus,
    currentPhase,
    phaseIndex,
    phases,
    stack,
    checkApi,
    nextPhase,
  }
})
