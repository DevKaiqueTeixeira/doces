import type { CreatedOrder } from '../types/orders'

import { getOrderPendingAmount, getOrderReceivedAmount } from './order-payment'

type OrderChargePixConfig = {
  key: string
  receiverName: string
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

export function resolveOrderChargePixConfig(userName?: string | null): OrderChargePixConfig {
  const defaultPixConfig = {
    key: import.meta.env.VITE_PIX_KEY?.trim() ?? '',
    receiverName: import.meta.env.VITE_PIX_RECEIVER_NAME?.trim() ?? '',
  }
  const normalizedUserName = userName?.trim().toLowerCase() ?? ''

  if (normalizedUserName === 'lis') {
    return {
      key: import.meta.env.VITE_PIX_MAE?.trim() || defaultPixConfig.key,
      receiverName: import.meta.env.VITE_PIX_FAVORECIDO_MAE?.trim() || defaultPixConfig.receiverName,
    }
  }

  return defaultPixConfig
}

export function buildOrderChargeMessage(order: CreatedOrder, pixKey: string, pixReceiverName: string) {
  const items = (order.items ?? []).map(
    (item) => `🍫 ${item.produtoNome} x ${item.quantidade} (${formatCurrency(item.subtotal)})`,
  )
  const paidAmount = getOrderReceivedAmount(order)
  const pendingAmount = getOrderPendingAmount(order)
  const paymentSteps =
    pendingAmount > 0
      ? [
          `Valor restante: ${formatCurrency(pendingAmount)}`,
          '',
          'Para pagamento via PIX ✨:',
          `Chave: ${pixKey}`,
          `Favorecido: ${pixReceiverName}`,
          '',
          'Assim que o pagamento for realizado, por favor envie o comprovante por aqui. 🙏',
        ]
      : ['Pagamento ja recebido integralmente.']

  return [
    `Olá, ${order.clienteNome}.`,
    '',
    'Segue o resumo do seu pedido na Jessy Doces 🍫:',
    ...items,
    '',
    `Valor total: ${formatCurrency(order.total)}`,
    ...(paidAmount > 0 ? [`Pagamento ja recebido: ${formatCurrency(paidAmount)}`] : []),
    ...paymentSteps,
    '',
    'Obrigada! 💜',
  ].join('\n')
}
