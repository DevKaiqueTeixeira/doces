<template>
  <QLayout view="lHh Lpr lFf" class="orders-layout">
    <AppNavBar
      active="pedidos"
      :open-total="openTotal"
      :received-total="receivedTotal"
      @navigate="handleNavigate"
      @logout="handleLogout"
    />

    <QPageContainer>
      <QPage class="orders-page">
        <QCard flat class="orders-card">
          <QCardSection>
            <div class="orders-filters">
              <QInput
                ref="searchInputRef"
                v-model="searchTerm"
                outlined
                dense
                clearable
                hide-bottom-space
                color="primary"
                bg-color="white"
                placeholder="Pesquisar cliente"
                input-class="orders-filters__input"
                class="orders-filters__search"
                @clear="handleClearSearch"
              >
                <template #prepend>
                  <QIcon name="search" color="primary" />
                </template>
              </QInput>

              <QSelect
                v-model="ownerFilter"
                outlined
                dense
                emit-value
                map-options
                hide-bottom-space
                stack-label
                color="primary"
                bg-color="white"
                label="Feito por"
                :options="ownerOptions"
                options-dense
                popup-content-class="orders-status-menu"
                class="orders-filters__select"
                input-class="orders-filters__input orders-filters__input--select"
              >
                <template #prepend>
                  <QIcon name="badge" color="primary" />
                </template>
              </QSelect>

              <QSelect
                v-model="statusFilter"
                outlined
                dense
                emit-value
                map-options
                hide-bottom-space
                stack-label
                color="primary"
                bg-color="white"
                label="Status"
                :options="statusOptions"
                options-dense
                popup-content-class="orders-status-menu"
                class="orders-filters__select"
                input-class="orders-filters__input orders-filters__input--select"
              >
                <template #prepend>
                  <QIcon name="tune" color="primary" />
                </template>
              </QSelect>
            </div>

            <BaseTable
              :rows="filteredOrders"
              :columns="columns"
              :loading="loading"
              loading-text="Carregando pedidos..."
              :empty-text="ordersEmptyText"
              :empty-icon="ordersEmptyIcon"
            >
              <template #body-cell-updatedAt="props">
                <QTd :props="props">{{ formatDate(props.row.updatedAt ?? props.row.createdAt) }}</QTd>
              </template>

              <template #body-cell-total="props">
                <QTd :props="props">{{ formatCurrency(Number(props.row.total)) }}</QTd>
              </template>

              <template #body-cell-formaPagamento="props">
                <QTd :props="props">
                  <QChip
                    dense
                    :color="getOrderStatusColor(props.row)"
                    text-color="white"
                  >
                    {{ getOrderStatusLabel(props.row) }}
                  </QChip>
                </QTd>
              </template>

              <template #body-cell-pagamentoParcial="props">
                <QTd :props="props">{{ formatCurrency(getOrderReceivedAmount(props.row)) }}</QTd>
              </template>

              <template #body-cell-valorPendente="props">
                <QTd :props="props">{{ formatCurrency(getOrderPendingAmount(props.row)) }}</QTd>
              </template>

              <template #body-cell-actions="props">
                <QTd :props="props" class="orders-table__actions">
                  <QBtn
                    round
                    dense
                    flat
                    color="primary"
                    icon="add"
                    class="orders-table__icon-button orders-table__icon-button--add"
                    aria-label="Adicionar itens ao pedido"
                    :disable="props.row.formaPagamento !== 'aberto' || closingId === props.row.id || updatingId === props.row.id"
                    @click="openAddModal(props.row)"
                  />

                  <QBtn
                    round
                    dense
                    flat
                    color="warning"
                    icon="chat"
                    class="orders-table__icon-button orders-table__icon-button--charge"
                    aria-label="Cobrar cliente"
                    :disable="props.row.formaPagamento !== 'aberto'"
                    @click="openChargeModal(props.row)"
                  />

                  <QBtn
                    round
                    dense
                    flat
                    color="positive"
                    icon="check"
                    class="orders-table__icon-button orders-table__icon-button--receive"
                    aria-label="Receber pagamento"
                    :loading="closingId === props.row.id"
                    :disable="props.row.formaPagamento !== 'aberto' || updatingId === props.row.id"
                    @click="openPaymentDialog(props.row)"
                  />
                </QTd>
              </template>
            </BaseTable>
          </QCardSection>
        </QCard>
      </QPage>
    </QPageContainer>

    <QDialog v-model="dialogOpen" persistent>
      <QCard flat class="order-dialog">
        <QCardSection v-if="editingOrder" class="order-dialog__content">
          <section class="person-panel">
            <QIcon name="person" color="primary" size="26px" />
            <div class="entity-pair entity-pair--person">
              <span class="entity-pair__label">Cliente</span>
              <strong class="entity-pair__value">{{ editingOrder.clienteNome }}</strong>
            </div>
          </section>

          <div class="order-dialog__meta">
            <span class="entity-pair entity-pair--person entity-pair--inline">
              <small class="entity-pair__label">Feito por</small>
              <strong class="entity-pair__value">{{ editingOrder.usuarioNome }}</strong>
            </span>

            <div class="order-dialog__dates">
              <span class="entity-pair">
                <small class="entity-pair__label">Data do pedido</small>
                <strong class="entity-pair__value order-dialog__date-value">
                  {{ formatDate(editingOrder.createdAt) }}
                </strong>
              </span>

              <span class="entity-pair entity-pair--update">
                <small class="entity-pair__label">Atualizacao</small>
                <strong class="entity-pair__value order-dialog__date-value order-dialog__date-value--update">
                  {{ formatDate(editingOrder.updatedAt ?? editingOrder.createdAt) }}
                </strong>
              </span>
            </div>
          </div>

          <div class="order-dialog__list">
            <article v-for="product in editableProducts" :key="product.id" class="order-dialog__item">
              <div class="order-dialog__item-copy">
                <strong>{{ product.nome }}</strong>
                <span>
                  {{ formatCurrency(product.preco) }}
                  <em v-if="product.archived">Produto removido do catalogo</em>
                </span>
              </div>

              <div class="order-dialog__item-actions">
                <QBtn
                  round
                  dense
                  flat
                  color="primary"
                  icon="remove"
                  :disable="saving || getEditableQuantity(product.id) <= getBaseQuantity(product.id)"
                  @click="decrementEditableProduct(product.id)"
                />

                <span class="order-dialog__quantity">{{ getEditableQuantity(product.id) }}</span>

                <QBtn
                  round
                  dense
                  flat
                  color="primary"
                  icon="add"
                  :disable="saving || product.archived"
                  @click="incrementEditableProduct(product.id)"
                />
              </div>
            </article>
          </div>

          <section class="order-dialog__total">
            <span>Total atualizado</span>
            <strong>{{ formatCurrency(editableTotal) }}</strong>
          </section>

          <div class="order-dialog__actions">
            <BaseButton
              label="Cancelar"
              variant="ghost"
              :disabled="saving"
              @click="closeDialog"
            />

            <BaseButton
              label="Salvar"
              icon-right="check"
              :loading="saving"
              :disabled="!canSaveItems"
              @click="handleSaveItems"
            />
          </div>
        </QCardSection>
      </QCard>
      </QDialog>

      <QDialog v-model="paymentDialogOpen" persistent>
        <QCard flat class="payment-dialog">
          <QCardSection v-if="paymentOrder" class="payment-dialog__content">
            <div class="payment-dialog__header">
              <h2>Receber pagamento</h2>
              <p>Escolha se o valor recebido foi total ou parcial.</p>
            </div>

            <div class="payment-dialog__summary">
              <section class="payment-dialog__summary-card payment-dialog__summary-card--client entity-pair entity-pair--person">
                <small class="entity-pair__label">Cliente</small>
                <strong class="entity-pair__value">{{ paymentOrder.clienteNome }}</strong>
              </section>

              <section class="payment-dialog__summary-card payment-dialog__summary-card--amount entity-pair">
                <small class="entity-pair__label">Total do pedido</small>
                <strong class="entity-pair__value">{{ formatCurrency(paymentOrder.total) }}</strong>
              </section>

              <section class="payment-dialog__summary-card entity-pair">
                <small class="entity-pair__label">Ja recebido</small>
                <strong class="entity-pair__value">{{ formatCurrency(paymentReceivedAmount) }}</strong>
              </section>

              <section class="payment-dialog__summary-card entity-pair">
                <small class="entity-pair__label">Falta receber</small>
                <strong class="entity-pair__value">{{ formatCurrency(paymentPendingAmount) }}</strong>
              </section>
            </div>

            <QInput
              v-model="partialPaymentValue"
              outlined
              dense
              clearable
              hide-bottom-space
              type="text"
              inputmode="decimal"
              color="primary"
              bg-color="white"
              placeholder="Valor recebido agora"
              class="payment-dialog__input"
              input-class="orders-filters__input"
              :disable="closingId === paymentOrder.id"
              :error="Boolean(partialPaymentError)"
              :error-message="partialPaymentError"
            >
              <template #prepend>
                <QIcon name="attach_money" color="primary" />
              </template>
            </QInput>

            <div class="payment-dialog__actions">
              <BaseButton
                label="Cancelar"
                variant="ghost"
                :disabled="closingId === paymentOrder.id"
                @click="closePaymentDialog"
              />

              <BaseButton
                label="Pagar parcialmente"
                icon-right="payments"
                :loading="closingId === paymentOrder.id && paymentAction === 'partial'"
                :disabled="!canSubmitPartialPayment"
                @click="handleReceivePartialPayment"
              />

              <BaseButton
                label="Receber pagamento"
                icon-right="check"
                variant="success"
                :loading="closingId === paymentOrder.id && paymentAction === 'full'"
                :disabled="closingId === paymentOrder.id"
                @click="handleReceiveFullPayment"
              />
            </div>
          </QCardSection>
        </QCard>
      </QDialog>

      <QDialog v-model="chargeDialogOpen">
        <QCard flat class="charge-dialog">
        <QCardSection v-if="chargeOrder" class="charge-dialog__content">
          <div class="charge-dialog__header">
            <h2>Cobrar cliente</h2>
          </div>

          <div class="charge-dialog__meta">
            <span class="charge-dialog__meta-item entity-pair entity-pair--person">
              <small class="entity-pair__label">Cliente</small>
              <strong class="entity-pair__value">{{ chargeOrder.clienteNome }}</strong>
            </span>

            <span class="charge-dialog__meta-item charge-dialog__meta-item--total entity-pair">
              <small class="entity-pair__label">Total do pedido</small>
              <strong class="entity-pair__value">{{ formatCurrency(chargeOrder.total) }}</strong>
            </span>

            <span class="charge-dialog__meta-item entity-pair">
              <small class="entity-pair__label">Ja recebido</small>
              <strong class="entity-pair__value">{{ formatCurrency(getOrderReceivedAmount(chargeOrder)) }}</strong>
            </span>

            <span class="charge-dialog__meta-item entity-pair">
              <small class="entity-pair__label">Falta receber</small>
              <strong class="entity-pair__value">{{ formatCurrency(getOrderPendingAmount(chargeOrder)) }}</strong>
            </span>
          </div>

          <section class="charge-dialog__message">
            <span class="charge-dialog__message-label">Mensagem pronta</span>
            <pre class="charge-dialog__message-content">{{ chargeMessage }}</pre>
          </section>

          <div class="charge-dialog__actions">
            <QBtn
              round
              unelevated
              color="white"
              text-color="primary"
              icon="close"
              aria-label="Fechar"
              class="charge-dialog__icon-action charge-dialog__icon-action--ghost"
              @click="closeChargeDialog"
            >
              <QTooltip>Fechar</QTooltip>
            </QBtn>

            <QBtn
              round
              unelevated
              color="white"
              text-color="primary"
              icon="content_copy"
              aria-label="Copiar mensagem"
              class="charge-dialog__icon-action charge-dialog__icon-action--ghost"
              @click="handleCopyChargeMessage"
            >
              <QTooltip>Copiar mensagem</QTooltip>
            </QBtn>

            <QBtn
              round
              unelevated
              color="white"
              text-color="warning"
              icon="share"
              aria-label="Compartilhar"
              class="charge-dialog__icon-action charge-dialog__icon-action--share"
              :disable="!canShareMessage"
              @click="handleShareChargeMessage"
            >
              <QTooltip>Compartilhar</QTooltip>
            </QBtn>
          </div>
        </QCardSection>
      </QCard>
    </QDialog>
  </QLayout>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { QBtn, QCard, QCardSection, QChip, QDialog, QIcon, QInput, QLayout, QPage, QPageContainer, QSelect, QTd, QTooltip, useQuasar } from 'quasar'
import { useRouter } from 'vue-router'

import AppNavBar from '../components/AppNavBar.vue'
import BaseButton from '../components/base/BaseButton.vue'
import BaseTable from '../components/base/BaseTable.vue'
import { useAuthStore } from '../stores/auth'
import { useOrdersStore } from '../stores/orders'
import { useProductsStore } from '../stores/products'
import type { CreatedOrder } from '../types/orders'
import { buildOrderChargeMessage, resolveOrderChargePixConfig } from '../utils/order-charge'
import { getOrderPendingAmount, getOrderReceivedAmount, hasPartialPayment } from '../utils/order-payment'

type EditableOrderProduct = {
  id: string
  nome: string
  preco: number
  archived: boolean
}

type OrderStatusFilter = 'todos' | 'aberto' | 'avista'

const columns = [
  { name: 'actions', label: 'Acoes', field: 'id', align: 'left' as const },
  { name: 'clienteNome', label: 'Cliente', field: 'clienteNome', align: 'left' as const, sortable: true },
  { name: 'formaPagamento', label: 'Status', field: 'formaPagamento', align: 'left' as const, sortable: true },
  { name: 'total', label: 'Total', field: 'total', align: 'left' as const, sortable: true },
  {
    name: 'pagamentoParcial',
    label: 'Pago',
    field: (row: CreatedOrder) => getOrderReceivedAmount(row),
    align: 'left' as const,
    sortable: true,
  },
  {
    name: 'valorPendente',
    label: 'Falta',
    field: (row: CreatedOrder) => getOrderPendingAmount(row),
    align: 'left' as const,
    sortable: true,
  },
  { name: 'usuarioNome', label: 'Feito por', field: 'usuarioNome', align: 'left' as const, sortable: true },
  { name: 'updatedAt', label: 'Data', field: 'updatedAt', align: 'left' as const, sortable: true },
]

const authStore = useAuthStore()
const ordersStore = useOrdersStore()
const productsStore = useProductsStore()
const $q = useQuasar()
const router = useRouter()
const { token, user } = storeToRefs(authStore)
const { closingId, errorMessage, items, loading, openTotal, receivedTotal, saving, updatingId } = storeToRefs(ordersStore)
const { items: products } = storeToRefs(productsStore)

const chargeDialogOpen = ref(false)
const dialogOpen = ref(false)
const paymentDialogOpen = ref(false)
const searchInputRef = ref<{ focus?: () => void } | null>(null)
const editingOrderId = ref('')
const chargeOrderId = ref('')
const paymentOrderId = ref('')
const paymentAction = ref<'full' | 'partial' | ''>('')
const searchTerm = ref<string | null>('')
const statusFilter = ref<OrderStatusFilter>('todos')
const ownerFilter = ref(normalizeOwnerValue(user.value?.nome) || 'todos')
const editableQuantities = ref<Record<string, number>>({})
const baseQuantities = ref<Record<string, number>>({})
const partialPaymentValue = ref('')

const statusOptions = [
  { label: 'Todos', value: 'todos' },
  { label: 'Em aberto', value: 'aberto' },
  { label: 'Recebido', value: 'avista' },
] as const

const ownerOptions = computed(() => {
  const owners = new Map<string, string>([
    ['jessy', 'Jessy'],
    ['lis', 'Lis'],
  ])

  for (const order of items.value) {
    const normalizedName = normalizeOwnerValue(order.usuarioNome)

    if (!normalizedName || owners.has(normalizedName)) {
      continue
    }

    owners.set(normalizedName, formatOwnerLabel(order.usuarioNome))
  }

  return [
    { label: 'Todos', value: 'todos' },
    ...[...owners.entries()]
      .sort((left, right) => left[1].localeCompare(right[1], 'pt-BR'))
      .map(([value, label]) => ({ label, value })),
  ]
})

const editingOrder = computed(() => items.value.find((order) => order.id === editingOrderId.value) ?? null)
const chargeOrder = computed(() => items.value.find((order) => order.id === chargeOrderId.value) ?? null)
const paymentOrder = computed(() => items.value.find((order) => order.id === paymentOrderId.value) ?? null)

const editableProducts = computed<EditableOrderProduct[]>(() => {
  const productMap = new Map<string, EditableOrderProduct>()

  for (const product of products.value) {
    productMap.set(product.id, {
      id: product.id,
      nome: product.nome,
      preco: product.preco,
      archived: false,
    })
  }

  for (const item of editingOrder.value?.items ?? []) {
    if (productMap.has(item.produtoId)) {
      continue
    }

    productMap.set(item.produtoId, {
      id: item.produtoId,
      nome: item.produtoNome,
      preco: item.precoUnitario,
      archived: true,
    })
  }

  return [...productMap.values()].sort((left, right) => left.nome.localeCompare(right.nome, 'pt-BR'))
})

const editableTotal = computed(() => {
  return editableProducts.value.reduce((sum, product) => {
    const quantity = editableQuantities.value[product.id] ?? 0
    return sum + quantity * product.preco
  }, 0)
})

const canSaveItems = computed(() => {
  return Boolean(editingOrder.value) && !saving.value && editableTotal.value > 0
})

const chargePixConfig = computed(() => resolveOrderChargePixConfig(user.value?.nome))

const chargeMessage = computed(() => {
  if (!chargeOrder.value) {
    return ''
  }

  return buildOrderChargeMessage(
    chargeOrder.value,
    chargePixConfig.value.key,
    chargePixConfig.value.receiverName,
  )
})

const canShareMessage = computed(() => typeof navigator !== 'undefined' && typeof navigator.share === 'function')

const paymentReceivedAmount = computed(() => (paymentOrder.value ? getOrderReceivedAmount(paymentOrder.value) : 0))
const paymentPendingAmount = computed(() => (paymentOrder.value ? getOrderPendingAmount(paymentOrder.value) : 0))

const partialPaymentAmount = computed(() => {
  const normalizedValue = String(partialPaymentValue.value ?? '').trim().replace(',', '.')
  return normalizedValue ? Number(normalizedValue) : Number.NaN
})

const partialPaymentError = computed(() => {
  if (!paymentOrder.value || !String(partialPaymentValue.value ?? '').trim()) {
    return ''
  }

  if (!Number.isFinite(partialPaymentAmount.value) || partialPaymentAmount.value <= 0) {
    return 'Informe um valor maior que zero.'
  }

  if (paymentPendingAmount.value <= 0) {
    return 'Esse pedido nao possui saldo em aberto.'
  }

  if (partialPaymentAmount.value > paymentPendingAmount.value) {
    return `O valor nao pode ser maior que ${formatCurrency(paymentPendingAmount.value)}.`
  }

  return ''
})

const canSubmitPartialPayment = computed(() => {
  return (
    Boolean(paymentOrder.value) &&
    Boolean(String(partialPaymentValue.value ?? '').trim()) &&
    !partialPaymentError.value &&
    closingId.value !== paymentOrder.value?.id
  )
})

const filteredOrders = computed(() => {
  const normalizedSearch = String(searchTerm.value ?? '').trim().toLowerCase()

  return items.value.filter((order) => {
    if (statusFilter.value !== 'todos' && order.formaPagamento !== statusFilter.value) {
      return false
    }

    if (ownerFilter.value !== 'todos' && normalizeOwnerValue(order.usuarioNome) !== ownerFilter.value) {
      return false
    }

    if (!normalizedSearch) {
      return true
    }

    const searchableText = [
      order.clienteNome,
      order.usuarioNome,
      formatDate(order.updatedAt ?? order.createdAt),
      formatCurrency(order.total),
      formatCurrency(getOrderReceivedAmount(order)),
      formatCurrency(getOrderPendingAmount(order)),
    ]
      .join(' ')
      .toLowerCase()

    return searchableText.includes(normalizedSearch)
  })
})

const ordersEmptyText = computed(() => {
  if (String(searchTerm.value ?? '').trim() || statusFilter.value !== 'todos' || ownerFilter.value !== 'todos') {
    return 'Nenhum pedido encontrado com esses filtros.'
  }

  return 'Nenhum pedido cadastrado ainda.'
})

const ordersEmptyIcon = computed(() => {
  if (String(searchTerm.value ?? '').trim() || statusFilter.value !== 'todos' || ownerFilter.value !== 'todos') {
    return 'person_search'
  }

  return 'inventory_2'
})

watch(errorMessage, (message) => {
  if (!message) {
    return
  }

  $q.notify({ type: 'negative', message, position: 'top', timeout: 2600, progress: true })
})

onMounted(async () => {
  if (!token.value) {
    return
  }

  try {
    await Promise.all([ordersStore.loadOrders(token.value), productsStore.loadProducts(token.value)])
  } catch {
    return
  }
})

function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(value))
}

function formatOwnerLabel(value: string) {
  const normalizedValue = value.trim()

  if (!normalizedValue) {
    return ''
  }

  return normalizedValue.charAt(0).toUpperCase() + normalizedValue.slice(1)
}

function normalizeOwnerValue(value?: string | null) {
  return value?.trim().toLowerCase() ?? ''
}

function getBaseQuantity(productId: string) {
  return baseQuantities.value[productId] ?? 0
}

function getEditableQuantity(productId: string) {
  return editableQuantities.value[productId] ?? 0
}

function getOrderStatusLabel(order: CreatedOrder) {
  if (order.formaPagamento === 'avista') {
    return 'Recebido'
  }

  if (hasPartialPayment(order)) {
    return 'Parcial'
  }

  return 'Em aberto'
}

function getOrderStatusColor(order: CreatedOrder) {
  if (order.formaPagamento === 'avista') {
    return 'positive'
  }

  if (hasPartialPayment(order)) {
    return 'amber-8'
  }

  return 'orange-8'
}

function openAddModal(order: CreatedOrder) {
  editingOrderId.value = order.id
  baseQuantities.value = Object.fromEntries((order.items ?? []).map((item) => [item.produtoId, item.quantidade]))
  editableQuantities.value = { ...baseQuantities.value }
  dialogOpen.value = true
}

function openChargeModal(order: CreatedOrder) {
  chargeOrderId.value = order.id
  chargeDialogOpen.value = true
}

function openPaymentDialog(order: CreatedOrder) {
  paymentOrderId.value = order.id
  partialPaymentValue.value = ''
  paymentAction.value = ''
  paymentDialogOpen.value = true
}

async function handleClearSearch() {
  searchTerm.value = ''
  await nextTick()
  searchInputRef.value?.focus?.()
}

function closeDialog() {
  if (saving.value) {
    return
  }

  dialogOpen.value = false
  editingOrderId.value = ''
  baseQuantities.value = {}
  editableQuantities.value = {}
}

function closeChargeDialog() {
  chargeDialogOpen.value = false
  chargeOrderId.value = ''
}

function closePaymentDialog() {
  if (paymentOrder.value && closingId.value === paymentOrder.value.id) {
    return
  }

  paymentDialogOpen.value = false
  paymentOrderId.value = ''
  partialPaymentValue.value = ''
  paymentAction.value = ''
}

function incrementEditableProduct(productId: string) {
  editableQuantities.value = {
    ...editableQuantities.value,
    [productId]: getEditableQuantity(productId) + 1,
  }
}

function decrementEditableProduct(productId: string) {
  const minQuantity = getBaseQuantity(productId)
  const nextQuantity = Math.max(minQuantity, getEditableQuantity(productId) - 1)
  editableQuantities.value = {
    ...editableQuantities.value,
    [productId]: nextQuantity,
  }
}

async function handleCopyChargeMessage() {
  if (!chargeMessage.value || typeof navigator === 'undefined' || !navigator.clipboard) {
    return
  }

  try {
    await navigator.clipboard.writeText(chargeMessage.value)
    $q.notify({ type: 'positive', message: 'Mensagem copiada com sucesso.', position: 'bottom', timeout: 2200 })
  } catch {
    $q.notify({ type: 'negative', message: 'Nao foi possivel copiar a mensagem.', position: 'top', timeout: 2200 })
  }
}

async function handleShareChargeMessage() {
  if (!chargeMessage.value || typeof navigator === 'undefined' || typeof navigator.share !== 'function') {
    return
  }

  try {
    await navigator.share({
      title: 'Cobranca Jessy Doces',
      text: chargeMessage.value,
    })
  } catch {
    return
  }
}

async function handleReceiveFullPayment() {
  if (!token.value || !paymentOrder.value) {
    return
  }

  paymentAction.value = 'full'

  try {
    await ordersStore.closeExistingOrder(token.value, paymentOrder.value.id)
    $q.notify({ type: 'positive', message: 'Pagamento recebido com sucesso.', position: 'bottom', timeout: 2200 })
    closePaymentDialog()
  } catch {
    return
  } finally {
    paymentAction.value = ''
  }
}

async function handleReceivePartialPayment() {
  if (!token.value || !paymentOrder.value || !canSubmitPartialPayment.value) {
    return
  }

  paymentAction.value = 'partial'

  try {
    const updatedOrder = await ordersStore.receiveExistingOrderPartialPayment(token.value, paymentOrder.value.id, {
      valorRecebido: Number(partialPaymentAmount.value.toFixed(2)),
    })

    $q.notify({
      type: 'positive',
      message:
        updatedOrder.formaPagamento === 'avista'
          ? 'Pagamento finalizado com sucesso.'
          : 'Pagamento parcial registrado com sucesso.',
      position: 'bottom',
      timeout: 2200,
    })
    closePaymentDialog()
  } catch {
    return
  } finally {
    paymentAction.value = ''
  }
}

async function handleSaveItems() {
  if (!token.value || !editingOrder.value || !canSaveItems.value) {
    return
  }

  try {
    await ordersStore.appendOrderItems(token.value, editingOrder.value.id, {
      itens: Object.entries(editableQuantities.value)
        .map(([produtoId, quantidade]) => ({ produtoId, quantidade }))
        .filter((item) => item.quantidade > 0),
    })

    $q.notify({ type: 'positive', message: 'Pedido atualizado com sucesso.', position: 'bottom', timeout: 2200 })
    closeDialog()
  } catch {
    return
  }
}

async function handleNavigate(target: 'home' | 'produtos' | 'pedidos') {
  const nextPath = target === 'home' ? '/home' : target === 'produtos' ? '/produtos' : '/pedidos'
  await router.push(nextPath)
}

async function handleLogout() {
  authStore.logout()
  await router.replace('/login')
}
</script>

<style scoped>
.orders-layout {
  background: linear-gradient(180deg, #f8f1ff 0%, #efe0ff 100%);
}

.orders-page {
  padding: 14px;
}

.orders-card,
.order-dialog,
.payment-dialog {
  border-radius: 28px;
  background: rgba(255, 255, 255, 0.97);
  box-shadow: 0 22px 48px rgba(76, 29, 149, 0.12);
}

.orders-filters {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
  margin-bottom: 18px;
}

.orders-filters__search {
  grid-column: 1 / -1;
}

.orders-filters__search,
.orders-filters__select {
  width: 100%;
}

.orders-filters:deep(.q-field__control) {
  border-radius: 16px;
  min-height: 48px;
  padding-inline: 4px;
  background: linear-gradient(180deg, #ffffff 0%, #fdfbff 100%);
  box-shadow: none;
}

.orders-filters:deep(.q-field__bottom) {
  display: none;
}

.orders-filters:deep(.q-field--outlined .q-field__control::before) {
  border: 1px solid #c4b5fd;
}

.orders-filters:deep(.q-field--outlined .q-field__control::after) {
  display: none;
}

.orders-filters:deep(.q-field__native),
.orders-filters:deep(.q-field__input) {
  display: flex;
  align-items: center;
  min-height: 100%;
  padding-top: 0;
  padding-bottom: 0;
}

.orders-filters:deep(.q-field__control-container) {
  height: 100%;
}

.orders-filters:deep(.q-field__marginal) {
  height: 48px;
  align-items: center;
}

.orders-filters:deep(.q-field__label) {
  color: #8b5cf6;
  font-size: 0.76rem;
  font-weight: 600;
  letter-spacing: 0.04em;
}

.orders-filters:deep(.q-field__prepend),
.orders-filters:deep(.q-field__append) {
  align-self: center;
}

.orders-filters__input {
  color: #7c3aed;
  font-size: 0.95rem;
  font-weight: 500;
}

.orders-filters__input::placeholder {
  color: #a78bfa;
  opacity: 1;
}

.orders-filters__input--select {
  text-align: center;
}

.orders-filters__select:deep(.q-field__native span),
.orders-filters__select:deep(.q-field__input span),
.orders-filters__select:deep(.q-item__label) {
  color: #7c3aed;
}

.orders-filters__select:deep(.q-field__native),
.orders-filters__select:deep(.q-field__input) {
  color: #7c3aed;
  font-weight: 500;
}

.orders-filters__select:deep(.q-field__append .q-icon) {
  color: #6b7280;
}

:global(.orders-status-menu) {
  border-radius: 16px;
  padding: 6px;
  background: #ffffff;
  box-shadow: 0 16px 36px rgba(17, 24, 39, 0.12);
}

:global(.orders-status-menu .q-item) {
  min-height: 40px;
  border-radius: 12px;
  color: #7c3aed;
}

:global(.orders-status-menu .q-item__label) {
  color: #7c3aed;
  font-weight: 500;
}

:global(.orders-status-menu .q-item--active),
:global(.orders-status-menu .q-item:hover) {
  background: #f5edff;
}

.orders-table__actions {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 6px;
}

.orders-table__icon-button {
  background: rgba(255, 255, 255, 0.92);
  border: 1px solid rgba(124, 58, 237, 0.08);
  box-shadow: 0 8px 18px rgba(124, 58, 237, 0.08);
}

.orders-table__icon-button--add {
  background: rgba(124, 58, 237, 0.1);
}

.orders-table__icon-button--charge {
  background: rgba(245, 158, 11, 0.14);
}

.orders-table__icon-button--receive {
  background: rgba(34, 197, 94, 0.12);
}

.order-dialog {
  width: min(100vw - 24px, 560px);
}

.payment-dialog {
  width: min(100vw - 24px, 620px);
}

.payment-dialog__content {
  display: grid;
  gap: 16px;
}

.payment-dialog__header {
  display: grid;
  gap: 6px;
  text-align: center;
}

.payment-dialog__header h2 {
  margin: 0;
  color: #3b0764;
  font-size: 1.2rem;
  font-weight: 700;
}

.payment-dialog__header p {
  margin: 0;
  color: #6b21a8;
}

.payment-dialog__summary {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.payment-dialog__summary-card {
  min-width: 0;
  display: grid;
  gap: 6px;
  padding: 14px 16px;
  border-radius: 20px;
  background: #faf5ff;
  border: 1px solid rgba(196, 181, 253, 0.55);
}

.payment-dialog__summary-card--client {
  grid-column: 1 / -1;
}

.payment-dialog__summary-card--amount {
  background: linear-gradient(135deg, rgba(236, 253, 245, 0.98), rgba(209, 250, 229, 0.96));
  border-color: rgba(110, 231, 183, 0.7);
}

.payment-dialog__summary-card :deep(.entity-pair__label) {
  color: #8b5cf6;
}

.payment-dialog__summary-card :deep(.entity-pair__value) {
  color: #3b0764;
  font-size: 1rem;
  font-weight: 700;
}

.payment-dialog__summary-card--amount :deep(.entity-pair__value) {
  color: #111827;
  font-size: 1.2rem;
  font-weight: 800;
}

.payment-dialog__input:deep(.q-field__control) {
  border-radius: 16px;
  min-height: 48px;
  padding-inline: 4px;
  background: linear-gradient(180deg, #ffffff 0%, #fdfbff 100%);
  box-shadow: none;
}

.payment-dialog__input:deep(.q-field__native),
.payment-dialog__input:deep(.q-field__input) {
  display: flex;
  align-items: center;
  min-height: 100%;
  padding-top: 0;
  padding-bottom: 0;
}

.payment-dialog__input:deep(.q-field__control-container) {
  height: 100%;
}

.payment-dialog__input:deep(.q-field__marginal) {
  height: 48px;
  align-items: center;
}

.payment-dialog__input:deep(.q-field__prepend),
.payment-dialog__input:deep(.q-field__append) {
  align-self: center;
}

.payment-dialog__input:deep(.q-field--outlined .q-field__control::before) {
  border: 1px solid #c4b5fd;
}

.payment-dialog__input:deep(.q-field--focused.q-field--outlined .q-field__control::before) {
  border: 1px solid #c4b5fd;
}

.payment-dialog__input:deep(.q-field--outlined .q-field__control::after) {
  display: none;
}

.payment-dialog__input:deep(.q-field--focused .q-field__control) {
  box-shadow: none;
}

.payment-dialog__actions {
  display: grid;
  gap: 12px;
}

.charge-dialog {
  width: min(100vw - 24px, 560px);
  border-radius: 28px;
  background: rgba(255, 255, 255, 0.98);
  box-shadow: 0 22px 48px rgba(76, 29, 149, 0.14);
}

.charge-dialog__content {
  display: grid;
  gap: 16px;
}

.charge-dialog__header {
  text-align: center;
}

.charge-dialog__header h2 {
  margin: 0;
  color: #3b0764;
  font-size: 1.1rem;
  font-weight: 700;
}

.charge-dialog__meta {
  display: flex;
  justify-content: space-between;
  align-items: end;
  gap: 12px;
  flex-wrap: wrap;
}

.charge-dialog__meta-item {
  min-width: 0;
}

.charge-dialog__meta-item--total {
  text-align: right;
  padding: 10px 14px;
  border-radius: 18px;
  background: linear-gradient(135deg, rgba(236, 253, 245, 0.98), rgba(209, 250, 229, 0.96));
  border: 1px solid rgba(110, 231, 183, 0.7);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.7);
}

.charge-dialog__meta-item--total .entity-pair__label {
  color: #374151;
}

.charge-dialog__meta-item--total .entity-pair__value {
  color: #111827;
  font-size: 1.32rem;
  font-weight: 800;
  line-height: 1;
  font-variant-numeric: tabular-nums;
}

.charge-dialog__message {
  display: grid;
  gap: 10px;
  padding: 14px 16px;
  border-radius: 20px;
  background: #faf5ff;
  border: 1px solid rgba(196, 181, 253, 0.55);
}

.charge-dialog__message-label {
  color: #8b5cf6;
  font-size: 0.72rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.charge-dialog__message-content {
  margin: 0;
  color: #111827;
  font-family: var(--login-sans-font, Inter, system-ui, sans-serif);
  font-size: 0.97rem;
  line-height: 1.7;
  white-space: pre-wrap;
}

.charge-dialog__actions {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 14px;
}

.charge-dialog__icon-action {
  width: 54px;
  height: 54px;
  border-radius: 50%;
  background: linear-gradient(135deg, #7c3aed 0%, #9333ea 100%);
  box-shadow: 0 14px 28px rgba(124, 58, 237, 0.18);
}

.charge-dialog__icon-action--ghost {
  background: white;
  border: 1px solid rgba(196, 181, 253, 0.8);
  box-shadow: none;
}

.charge-dialog__icon-action--share {
  border: 1px solid rgba(245, 158, 11, 0.24);
  background: linear-gradient(135deg, #fffdf7 0%, #fff7d6 100%);
  box-shadow: 0 14px 28px rgba(245, 158, 11, 0.18);
}

.order-dialog__content {
  display: grid;
  gap: 16px;
}

.person-panel {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 12px;
  align-items: center;
  padding: 14px 16px;
  border-radius: 20px;
  background: #faf5ff;
  border: 1px solid rgba(196, 181, 253, 0.55);
}

.order-dialog__meta {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
  align-items: start;
  font-size: 0.88rem;
}

.order-dialog__dates {
  display: grid;
  gap: 10px;
  justify-items: end;
}

.order-dialog__date-value {
  color: #111827;
  font-size: 0.95rem;
  font-weight: 700;
}

.order-dialog__date-value--update {
  color: #0f766e;
}

.order-dialog__list {
  display: grid;
  gap: 10px;
}

.order-dialog__item {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 10px;
  align-items: center;
  padding: 12px 14px;
  border-radius: 18px;
  background: #faf5ff;
}

.order-dialog__item-copy {
  display: grid;
  gap: 4px;
}

.order-dialog__item-copy strong {
  color: #3b0764;
}

.order-dialog__item-copy span {
  color: #7e22ce;
  display: inline-flex;
  flex-wrap: wrap;
  gap: 8px;
}

.order-dialog__item-copy em {
  color: #9a3412;
  font-style: normal;
  font-size: 0.8rem;
}

.order-dialog__item-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.order-dialog__quantity {
  min-width: 24px;
  text-align: center;
  color: #4c1d95;
  font-weight: 700;
}

.order-dialog__total {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 16px;
  border-radius: 20px;
  background: linear-gradient(135deg, #f3e8ff 0%, #ede9fe 100%);
}

.order-dialog__total span {
  color: #6b21a8;
}

.order-dialog__total strong {
  color: #3b0764;
  font-size: 1.14rem;
}

.order-dialog__actions {
  display: grid;
  gap: 12px;
}

@media (min-width: 641px) {
  .orders-page {
    padding: 20px;
  }

  .orders-filters {
    grid-template-columns: minmax(0, 1fr) 180px 160px;
    gap: 12px;
    align-items: start;
  }

  .orders-filters__search {
    grid-column: auto;
  }

  .order-dialog__actions {
    grid-template-columns: 1fr 1fr;
  }

  .payment-dialog__actions {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .charge-dialog__actions {
    gap: 16px;
  }
}

@media (max-width: 640px) {
  .orders-filters {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 8px;
    align-items: start;
  }

  .orders-filters__input {
    font-size: 0.88rem;
  }

  .payment-dialog__summary {
    grid-template-columns: 1fr;
  }

  .payment-dialog__summary-card--client {
    grid-column: auto;
  }
}
</style>
