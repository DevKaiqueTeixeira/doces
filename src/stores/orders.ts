import { computed, ref } from 'vue'
import { defineStore } from 'pinia'

import { addItemsToOrder, closeOrder, createOrder, fetchOrders, payOrderPartially } from '../services/orders'
import type { CreateOrderPayload, CreatedOrder, PartialOrderPaymentPayload, UpdateOrderItemsPayload } from '../types/orders'
import { getOrderPendingAmount, getOrderReceivedAmount } from '../utils/order-payment'

function sortOrders(orders: CreatedOrder[]) {
  return [...orders].sort(
    (left, right) =>
      new Date(right.updatedAt ?? right.createdAt).getTime() -
      new Date(left.updatedAt ?? left.createdAt).getTime(),
  )
}

export const useOrdersStore = defineStore('orders', () => {
  const items = ref<CreatedOrder[]>([])
  const saving = ref(false)
  const loading = ref(false)
  const closingId = ref('')
  const updatingId = ref('')
  const errorMessage = ref('')

  const openTotal = computed(() =>
    items.value.reduce((sum, order) => sum + getOrderPendingAmount(order), 0),
  )

  const receivedTotal = computed(() =>
    items.value.reduce((sum, order) => sum + getOrderReceivedAmount(order), 0),
  )

  async function loadOrders(token: string) {
    loading.value = true
    errorMessage.value = ''

    try {
      items.value = sortOrders(await fetchOrders(token))
      return items.value
    } catch (error) {
      errorMessage.value = error instanceof Error ? error.message : 'Falha ao carregar pedidos.'
      throw error
    } finally {
      loading.value = false
    }
  }

  function upsertOrder(order: CreatedOrder) {
    const existingOrderIndex = items.value.findIndex((currentOrder) => currentOrder.id === order.id)

    if (existingOrderIndex === -1) {
      items.value = sortOrders([order, ...items.value])
      return
    }

    const existingOrder = items.value[existingOrderIndex]
    const nextOrder = {
      ...existingOrder,
      ...order,
      items: order.items ?? existingOrder.items,
    }

    items.value = sortOrders(
      items.value.map((currentOrder) => (currentOrder.id === order.id ? nextOrder : currentOrder)),
    )
  }

  async function createNewOrder(token: string, payload: CreateOrderPayload) {
    saving.value = true
    errorMessage.value = ''

    try {
      const createdOrder = await createOrder(token, payload)
      upsertOrder(createdOrder)
      return createdOrder
    } catch (error) {
      errorMessage.value = error instanceof Error ? error.message : 'Falha ao cadastrar pedido.'
      throw error
    } finally {
      saving.value = false
    }
  }

  async function closeExistingOrder(token: string, orderId: string) {
    closingId.value = orderId
    errorMessage.value = ''

    try {
      const updatedOrder = await closeOrder(token, orderId)
      upsertOrder(updatedOrder)
      return updatedOrder
    } catch (error) {
      errorMessage.value = error instanceof Error ? error.message : 'Falha ao encerrar pedido.'
      throw error
    } finally {
      closingId.value = ''
    }
  }

  async function receiveExistingOrderPartialPayment(
    token: string,
    orderId: string,
    payload: PartialOrderPaymentPayload,
  ) {
    closingId.value = orderId
    errorMessage.value = ''

    try {
      const updatedOrder = await payOrderPartially(token, orderId, payload)
      upsertOrder(updatedOrder)
      return updatedOrder
    } catch (error) {
      errorMessage.value = error instanceof Error ? error.message : 'Falha ao receber pagamento parcial.'
      throw error
    } finally {
      closingId.value = ''
    }
  }

  async function appendOrderItems(token: string, orderId: string, payload: UpdateOrderItemsPayload) {
    updatingId.value = orderId
    errorMessage.value = ''

    try {
      const updatedOrder = await addItemsToOrder(token, orderId, payload)
      upsertOrder(updatedOrder)
      return updatedOrder
    } catch (error) {
      errorMessage.value = error instanceof Error ? error.message : 'Falha ao adicionar itens ao pedido.'
      throw error
    } finally {
      updatingId.value = ''
    }
  }

  return {
    appendOrderItems,
    closingId,
    closeExistingOrder,
    createNewOrder,
    errorMessage,
    items,
    loading,
    loadOrders,
    openTotal,
    receiveExistingOrderPartialPayment,
    receivedTotal,
    saving,
    updatingId,
  }
})
