import { ref } from 'vue'
import { defineStore } from 'pinia'

import { createOrder } from '../services/orders'
import type { CreateOrderPayload } from '../types/orders'

export const useOrdersStore = defineStore('orders', () => {
  const saving = ref(false)
  const errorMessage = ref('')

  async function createNewOrder(token: string, payload: CreateOrderPayload) {
    saving.value = true
    errorMessage.value = ''

    try {
      return await createOrder(token, payload)
    } catch (error) {
      errorMessage.value = error instanceof Error ? error.message : 'Falha ao cadastrar pedido.'
      throw error
    } finally {
      saving.value = false
    }
  }

  return {
    createNewOrder,
    errorMessage,
    saving,
  }
})
