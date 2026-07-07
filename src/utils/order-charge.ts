import type { CreatedOrder } from '../types/orders'

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

  return [
    `Olá, ${order.clienteNome}.`,
    '',
    'Segue o resumo do seu pedido na Jessy Doces 🍫:',
    ...items,
    '',
    `Valor total: ${formatCurrency(order.total)}`,
    '',
    'Para pagamento via PIX ✨:',
    `Chave: ${pixKey}`,
    `Favorecido: ${pixReceiverName}`,
    '',
    'Assim que o pagamento for realizado, por favor envie o comprovante por aqui. 🙏',
    '',
    'Obrigada! 💜',
  ].join('\n')
}
