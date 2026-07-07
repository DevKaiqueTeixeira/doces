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
            <BaseTable
              :rows="items"
              :columns="columns"
              :loading="loading"
              loading-text="Carregando pedidos..."
              empty-text="Nenhum pedido cadastrado ainda."
            >
              <template #body-cell-createdAt="props">
                <QTd :props="props">{{ formatDate(props.row.createdAt) }}</QTd>
              </template>

              <template #body-cell-total="props">
                <QTd :props="props">{{ formatCurrency(Number(props.row.total)) }}</QTd>
              </template>

              <template #body-cell-formaPagamento="props">
                <QTd :props="props">
                  <QChip
                    dense
                    :color="props.row.formaPagamento === 'aberto' ? 'orange-8' : 'positive'"
                    text-color="white"
                  >
                    {{ props.row.formaPagamento === 'aberto' ? 'Em aberto' : 'Recebido' }}
                  </QChip>
                </QTd>
              </template>

              <template #body-cell-actions="props">
                <QTd :props="props" class="orders-table__actions">
                  <QBtn
                    round
                    dense
                    flat
                    color="primary"
                    icon="add"
                    aria-label="Adicionar itens ao pedido"
                    :disable="props.row.formaPagamento !== 'aberto' || closingId === props.row.id || updatingId === props.row.id"
                    @click="openAddModal(props.row)"
                  />

                  <QBtn
                    round
                    dense
                    flat
                    color="positive"
                    icon="check"
                    aria-label="Receber pagamento"
                    :loading="closingId === props.row.id"
                    :disable="props.row.formaPagamento !== 'aberto' || updatingId === props.row.id"
                    @click="handleCloseOrder(props.row.id)"
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
          <BaseInput
            :model-value="editingOrder.clienteNome"
            label="Cliente"
            icon="person"
            placeholder=""
            :disabled="true"
          />

          <div class="order-dialog__meta">
            <span>Pedido feito por {{ editingOrder.usuarioNome }}</span>
            <span>{{ formatDate(editingOrder.createdAt) }}</span>
          </div>

          <div class="order-dialog__list">
            <article v-for="product in products" :key="product.id" class="order-dialog__item">
              <div class="order-dialog__item-copy">
                <strong>{{ product.nome }}</strong>
                <span>{{ formatCurrency(product.preco) }}</span>
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
                  :disable="saving"
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

    <BaseConfirmDialog
      v-model="confirmDialog.open.value"
      :title="confirmDialog.options.value.title"
      :message="confirmDialog.options.value.message"
      :confirm-label="confirmDialog.options.value.confirmLabel"
      :cancel-label="confirmDialog.options.value.cancelLabel"
      :tone="confirmDialog.options.value.tone"
      :loading="confirmDialog.loading.value"
      @cancel="confirmDialog.cancel"
      @confirm="handleConfirmCloseOrder"
    />
  </QLayout>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { QBtn, QCard, QCardSection, QChip, QDialog, QLayout, QPage, QPageContainer, QTd, useQuasar } from 'quasar'
import { useRouter } from 'vue-router'

import AppNavBar from '../components/AppNavBar.vue'
import BaseButton from '../components/base/BaseButton.vue'
import BaseConfirmDialog from '../components/base/BaseConfirmDialog.vue'
import BaseInput from '../components/base/BaseInput.vue'
import BaseTable from '../components/base/BaseTable.vue'
import { useAuthStore } from '../stores/auth'
import { useOrdersStore } from '../stores/orders'
import { useProductsStore } from '../stores/products'
import type { CreatedOrder } from '../types/orders'
import { useConfirmDialog } from '../utils/use-confirm-dialog'

const columns = [
  { name: 'createdAt', label: 'Data', field: 'createdAt', align: 'left' as const, sortable: true },
  { name: 'clienteNome', label: 'Cliente', field: 'clienteNome', align: 'left' as const, sortable: true },
  { name: 'usuarioNome', label: 'Feito por', field: 'usuarioNome', align: 'left' as const, sortable: true },
  { name: 'formaPagamento', label: 'Status', field: 'formaPagamento', align: 'left' as const, sortable: true },
  { name: 'total', label: 'Total', field: 'total', align: 'left' as const, sortable: true },
  { name: 'actions', label: 'Acoes', field: 'id', align: 'right' as const },
]

const authStore = useAuthStore()
const ordersStore = useOrdersStore()
const productsStore = useProductsStore()
const $q = useQuasar()
const router = useRouter()

const { token } = storeToRefs(authStore)
const { closingId, errorMessage, items, loading, openTotal, receivedTotal, saving, updatingId } = storeToRefs(ordersStore)
const { items: products } = storeToRefs(productsStore)

const confirmDialog = useConfirmDialog()
const dialogOpen = ref(false)
const editingOrderId = ref('')
const editableQuantities = ref<Record<string, number>>({})
const baseQuantities = ref<Record<string, number>>({})
const pendingCloseOrderId = ref('')

const editingOrder = computed(() => items.value.find((order) => order.id === editingOrderId.value) ?? null)

const editableTotal = computed(() => {
  return products.value.reduce((sum, product) => {
    const quantity = editableQuantities.value[product.id] ?? 0
    return sum + quantity * product.preco
  }, 0)
})

const canSaveItems = computed(() => {
  return Boolean(editingOrder.value) && !saving.value && editableTotal.value > 0
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

function getBaseQuantity(productId: string) {
  return baseQuantities.value[productId] ?? 0
}

function getEditableQuantity(productId: string) {
  return editableQuantities.value[productId] ?? 0
}

function openAddModal(order: CreatedOrder) {
  editingOrderId.value = order.id
  baseQuantities.value = Object.fromEntries((order.items ?? []).map((item) => [item.produtoId, item.quantidade]))
  editableQuantities.value = { ...baseQuantities.value }
  dialogOpen.value = true
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

async function handleCloseOrder(orderId: string) {
  pendingCloseOrderId.value = orderId

  await confirmDialog.ask({
    title: 'Receber pagamento',
    message: 'Deseja receber o pagamento desse pedido?',
    confirmLabel: 'Receber pagamento',
    cancelLabel: 'Cancelar',
    tone: 'success',
  })
}

async function handleConfirmCloseOrder() {
  if (!token.value || !pendingCloseOrderId.value) {
    confirmDialog.cancel()
    return
  }

  try {
    await ordersStore.closeExistingOrder(token.value, pendingCloseOrderId.value)
    $q.notify({ type: 'positive', message: 'Pagamento recebido com sucesso.', position: 'top', timeout: 2200 })
    confirmDialog.finish()
    pendingCloseOrderId.value = ''
  } catch {
    confirmDialog.cancel()
    return
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

    $q.notify({ type: 'positive', message: 'Pedido atualizado com sucesso.', position: 'top', timeout: 2200 })
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
.order-dialog {
  border-radius: 28px;
  background: rgba(255, 255, 255, 0.97);
  box-shadow: 0 22px 48px rgba(76, 29, 149, 0.12);
}

.orders-table__actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
}

.order-dialog {
  width: min(100vw - 24px, 560px);
}

.order-dialog__content {
  display: grid;
  gap: 16px;
}

.order-dialog__meta {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
  color: #7e22ce;
  font-size: 0.88rem;
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

  .order-dialog__actions {
    grid-template-columns: 1fr 1fr;
  }
}
</style>
