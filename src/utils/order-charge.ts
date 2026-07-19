import type { CreatedOrder } from '../types/orders'

import { getOrderPendingAmount, getOrderReceivedAmount } from './order-payment'

function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
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
