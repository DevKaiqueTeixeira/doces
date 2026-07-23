type OrderPaymentSnapshot = {
  total: number
  pagamentoParcial: number
}

type OrderOwnerSnapshot = OrderPaymentSnapshot & {
  usuarioNome: string
}

function roundCurrency(value: number) {
  return Number(value.toFixed(2))
}

export function getOrderReceivedAmount(order: OrderPaymentSnapshot) {
  const total = Number(order.total) || 0
  const paidAmount = Number(order.pagamentoParcial) || 0
  return roundCurrency(Math.min(Math.max(paidAmount, 0), total))
}

export function getOrderPendingAmount(order: OrderPaymentSnapshot) {
  return roundCurrency(Math.max((Number(order.total) || 0) - getOrderReceivedAmount(order), 0))
}

export function hasPartialPayment(order: OrderPaymentSnapshot) {
  return getOrderReceivedAmount(order) > 0 && getOrderPendingAmount(order) > 0
}

export function normalizeOrderOwnerName(value?: string | null) {
  return value?.trim().toLowerCase() ?? ''
}

export function getOrderFinancialTotalsForOwner(orders: OrderOwnerSnapshot[], ownerName?: string | null) {
  const normalizedOwnerName = normalizeOrderOwnerName(ownerName)
  const ownerOrders = normalizedOwnerName
    ? orders.filter((order) => normalizeOrderOwnerName(order.usuarioNome) === normalizedOwnerName)
    : orders

  return ownerOrders.reduce(
    (totals, order) => ({
      openTotal: roundCurrency(totals.openTotal + getOrderPendingAmount(order)),
      receivedTotal: roundCurrency(totals.receivedTotal + getOrderReceivedAmount(order)),
    }),
    {
      openTotal: 0,
      receivedTotal: 0,
    },
  )
}
