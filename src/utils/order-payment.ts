type OrderPaymentSnapshot = {
  total: number
  pagamentoParcial: number
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
