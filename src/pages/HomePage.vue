<template>
  <QLayout view="lHh Lpr lFf" class="home-layout">
    <AppNavBar
      active="home"
      :open-total="openTotal"
      :received-total="receivedTotal"
      @navigate="handleNavigate"
      @logout="handleLogout"
    />

    <QPageContainer>
      <QPage class="home-page">
        <QCard flat class="order-card">
          <QCardSection class="order-card__header">
            <span class="order-card__eyebrow">Novo pedido</span>
            <h1>Cadastro de pedidos</h1>
          </QCardSection>

          <QCardSection class="order-card__body">
            <BaseInput
              v-model="clienteNome"
              label="Nome do cliente"
              icon="person"
              placeholder="Digite o nome do cliente"
              autocomplete="off"
              :disabled="saving"
              :rules="clientNameRules"
            />

            <section class="products-picker">
              <header class="products-picker__header">
                <span class="order-card__eyebrow">Produtos</span>
                <span class="products-picker__count">{{ selectedItemsCount }} item(ns)</span>
              </header>

              <div v-if="productsLoading" class="products-picker__state">
                <QSpinner color="primary" size="38px" />
                <span>Carregando produtos...</span>
              </div>

              <div v-else-if="!products.length" class="products-picker__state">
                <QIcon name="inventory_2" color="primary" size="38px" />
                <span>Nenhum produto cadastrado. Cadastre primeiro na tela de produtos.</span>
              </div>

              <div v-else class="products-picker__list">
                <article v-for="product in products" :key="product.id" class="product-row">
                  <div class="product-row__info">
                    <strong>{{ product.nome }}</strong>
                    <span>{{ formatCurrency(product.preco) }}</span>
                  </div>

                  <div class="product-row__actions">
                    <QBtn
                      round
                      dense
                      flat
                      color="primary"
                      icon="remove"
                      :disable="saving || getProductQuantity(product.id) === 0"
                      @click="decrementProduct(product.id)"
                    />

                    <span class="product-row__quantity">{{ getProductQuantity(product.id) }}</span>

                    <QBtn
                      round
                      dense
                      flat
                      color="primary"
                      icon="add"
                      :disable="saving"
                      @click="incrementProduct(product.id)"
                    />
                  </div>
                </article>
              </div>
            </section>

            <section class="order-total">
              <span>Total</span>
              <strong>{{ formatCurrency(totalAmount) }}</strong>
            </section>

            <div class="order-actions">
              <BaseButton
                label="Deixar em aberto"
                icon="schedule"
                :loading="saving && submittingMode === 'aberto'"
                :disabled="!canSubmit || (saving && submittingMode !== 'aberto')"
                @click="handleCreateOrder('aberto')"
              />

              <BaseButton
                label="A vista"
                icon="payments"
                variant="ghost"
                :loading="saving && submittingMode === 'avista'"
                :disabled="!canSubmit || (saving && submittingMode !== 'avista')"
                @click="handleCreateOrder('avista')"
              />
            </div>
          </QCardSection>
        </QCard>
      </QPage>
    </QPageContainer>
  </QLayout>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { QBtn, QCard, QCardSection, QIcon, QLayout, QPage, QPageContainer, QSpinner, useQuasar } from 'quasar'
import { useRouter } from 'vue-router'

import AppNavBar from '../components/AppNavBar.vue'
import BaseButton from '../components/base/BaseButton.vue'
import BaseInput from '../components/base/BaseInput.vue'
import { useAuthStore } from '../stores/auth'
import { useOrdersStore } from '../stores/orders'
import { useProductsStore } from '../stores/products'
import type { OrderPaymentMode } from '../types/orders'

const authStore = useAuthStore()
const ordersStore = useOrdersStore()
const productsStore = useProductsStore()
const $q = useQuasar()
const router = useRouter()

const { token } = storeToRefs(authStore)
const { errorMessage: orderErrorMessage, openTotal, receivedTotal, saving } = storeToRefs(ordersStore)
const { errorMessage: productsErrorMessage, items: products, loading: productsLoading } = storeToRefs(productsStore)

const clienteNome = ref('')
const quantities = ref<Record<string, number>>({})
const submittingMode = ref<OrderPaymentMode | ''>('')

const clientNameRules = [
  (value: string | number | null | undefined) => Boolean(String(value ?? '').trim()) || 'Informe o nome do cliente',
]

const selectedItems = computed(() => {
  return products.value
    .map((product) => ({
      produtoId: product.id,
      quantidade: quantities.value[product.id] ?? 0,
      preco: product.preco,
    }))
    .filter((item) => item.quantidade > 0)
})

const selectedItemsCount = computed(() => {
  return selectedItems.value.reduce((sum, item) => sum + item.quantidade, 0)
})

const totalAmount = computed(() => {
  return selectedItems.value.reduce((sum, item) => sum + item.preco * item.quantidade, 0)
})

const canSubmit = computed(() => {
  return Boolean(clienteNome.value.trim()) && selectedItems.value.length > 0 && !saving.value
})

watch(orderErrorMessage, (message) => {
  if (!message) {
    return
  }

  $q.notify({ type: 'negative', message, position: 'top', timeout: 2600, progress: true })
})

watch(productsErrorMessage, (message) => {
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
    await Promise.all([productsStore.loadProducts(token.value), ordersStore.loadOrders(token.value)])
  } catch {
    return
  }
})

function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

function getProductQuantity(productId: string) {
  return quantities.value[productId] ?? 0
}

function incrementProduct(productId: string) {
  quantities.value = {
    ...quantities.value,
    [productId]: getProductQuantity(productId) + 1,
  }
}

function decrementProduct(productId: string) {
  const nextQuantity = Math.max(0, getProductQuantity(productId) - 1)
  quantities.value = {
    ...quantities.value,
    [productId]: nextQuantity,
  }
}

function resetForm() {
  clienteNome.value = ''
  quantities.value = {}
  submittingMode.value = ''
}

async function handleCreateOrder(mode: OrderPaymentMode) {
  if (!token.value || !canSubmit.value) {
    return
  }

  submittingMode.value = mode

  try {
    const createdOrder = await ordersStore.createNewOrder(token.value, {
      clienteNome: clienteNome.value.trim(),
      formaPagamento: mode,
      itens: selectedItems.value.map((item) => ({ produtoId: item.produtoId, quantidade: item.quantidade })),
    })

    $q.notify({
      type: 'positive',
      message:
        mode === 'avista'
          ? `Pedido cadastrado a vista. Total ${formatCurrency(createdOrder.total)}.`
          : `Pedido deixado em aberto. Total ${formatCurrency(createdOrder.total)}.`,
      position: 'top',
      timeout: 2400,
    })

    resetForm()
  } catch {
    return
  } finally {
    submittingMode.value = ''
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
.home-layout {
  background: linear-gradient(180deg, #f8f1ff 0%, #efe0ff 100%);
}

.home-page {
  padding: 14px;
}

.order-card {
  border-radius: 28px;
  background: rgba(255, 255, 255, 0.97);
  box-shadow: 0 22px 48px rgba(76, 29, 149, 0.12);
}

.order-card__header {
  display: grid;
  gap: 10px;
  justify-items: center;
  text-align: center;
}

.order-card__eyebrow {
  display: inline-flex;
  color: #9333ea;
  font-size: 0.74rem;
  font-weight: 700;
  letter-spacing: 0.18em;
  text-transform: uppercase;
}

.order-card h1 {
  margin: 0;
  color: #3b0764;
  font-size: clamp(1.8rem, 6vw, 2.2rem);
  text-align: center;
}

.order-card__body {
  display: grid;
  gap: 18px;
}

.products-picker {
  display: grid;
  gap: 14px;
}

.products-picker__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.products-picker__count {
  color: #7e22ce;
  font-size: 0.88rem;
  font-weight: 600;
}

.products-picker__state {
  min-height: 180px;
  display: grid;
  place-items: center;
  gap: 12px;
  text-align: center;
  color: #6b21a8;
  padding: 18px;
  border-radius: 22px;
  background: #faf5ff;
}

.products-picker__list {
  display: grid;
  gap: 12px;
}

.product-row {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 12px;
  align-items: center;
  padding: 14px 16px;
  border-radius: 20px;
  background: #faf5ff;
  border: 1px solid rgba(196, 181, 253, 0.6);
}

.product-row__info {
  display: grid;
  gap: 4px;
}

.product-row__info strong {
  color: #3b0764;
  font-size: 0.98rem;
}

.product-row__info span {
  color: #7e22ce;
  font-size: 0.9rem;
}

.product-row__actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.product-row__quantity {
  min-width: 24px;
  text-align: center;
  color: #4c1d95;
  font-size: 1rem;
  font-weight: 700;
}

.order-total {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 18px;
  border-radius: 22px;
  background: linear-gradient(135deg, #f3e8ff 0%, #ede9fe 100%);
}

.order-total span {
  color: #6b21a8;
  font-weight: 600;
}

.order-total strong {
  color: #3b0764;
  font-size: 1.18rem;
}

.order-actions {
  display: grid;
  gap: 12px;
}

@media (min-width: 641px) {
  .home-page {
    padding: 20px;
    display: grid;
    place-items: center;
  }

  .order-card {
    width: min(100%, 560px);
  }
}
</style>
