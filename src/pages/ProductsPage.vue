<template>
  <QLayout view="lHh Lpr lFf" class="products-layout">
    <AppNavBar
      active="produtos"
      :open-total="openTotal"
      :received-total="receivedTotal"
      @navigate="handleNavigate"
      @logout="handleLogout"
    />

    <QPageContainer>
      <QPage class="products-page">
        <QCard flat class="products-card">
          <QCardSection class="products-card__header">
            <BaseButton
              label="Cadastrar novo produto"
              icon="add"
              :full-width="false"
              compact
              @click="openCreateDialog"
            />
          </QCardSection>

          <QCardSection>
            <BaseTable
              :rows="items"
              :columns="columns"
              :loading="loading"
              loading-text="Carregando produtos..."
              empty-text="Nenhum produto cadastrado ainda."
            >
              <template #body-cell-preco="props">
                <QTd :props="props">
                  {{ formatCurrency(Number(props.row.preco)) }}
                </QTd>
              </template>

              <template #body-cell-actions="props">
                <QTd :props="props" class="products-table__actions">
                  <QBtn
                    flat
                    round
                    dense
                    color="primary"
                    icon="edit"
                    aria-label="Editar produto"
                    @click="openEditDialog(props.row)"
                  />

                  <QBtn
                    flat
                    round
                    dense
                    color="negative"
                    icon="delete"
                    aria-label="Excluir produto"
                    :loading="deletingId === props.row.id"
                    @click="handleDeleteProduct(props.row.id)"
                  />
                </QTd>
              </template>
            </BaseTable>
          </QCardSection>
        </QCard>
      </QPage>
    </QPageContainer>

    <QDialog v-model="dialogOpen" persistent>
      <QCard flat class="product-dialog">
        <QCardSection>
          <h2>{{ dialogTitle }}</h2>
        </QCardSection>

        <QCardSection>
          <QForm ref="dialogFormRef" class="product-dialog__form" @submit.prevent="handleSaveProduct">
            <BaseInput
              v-model="productForm.nome"
              label="Nome do produto"
              icon="inventory_2"
              placeholder="Ex.: Trufa de morango"
              autocomplete="off"
              :rules="productNameRules"
              :disabled="saving"
            />

            <BaseInput
              v-model="productForm.preco"
              type="number"
              label="Preco"
              icon="sell"
              placeholder="Ex.: 7.50"
              autocomplete="off"
              :rules="productPriceRules"
              :disabled="saving"
            />

            <div class="product-dialog__actions">
              <BaseButton
                label="Cancelar"
                variant="ghost"
                :loading="false"
                :disabled="saving"
                @click="closeDialog"
              />

              <BaseButton
                :label="dialogSubmitLabel"
                type="submit"
                icon-right="check"
                :loading="saving"
                :disabled="!canSubmitProductForm"
              />
            </div>
          </QForm>
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
      @confirm="handleConfirmDelete"
    />
  </QLayout>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { QBtn, QCard, QCardSection, QDialog, QForm, QLayout, QPage, QPageContainer, QTd, useQuasar } from 'quasar'
import { useRouter } from 'vue-router'

import AppNavBar from '../components/AppNavBar.vue'
import BaseButton from '../components/base/BaseButton.vue'
import BaseConfirmDialog from '../components/base/BaseConfirmDialog.vue'
import BaseInput from '../components/base/BaseInput.vue'
import BaseTable from '../components/base/BaseTable.vue'
import { useAuthStore } from '../stores/auth'
import { useOrdersStore } from '../stores/orders'
import { useProductsStore } from '../stores/products'
import type { Product } from '../types/products'
import { useConfirmDialog } from '../utils/use-confirm-dialog'

const columns = [
  { name: 'nome', label: 'Produto', field: 'nome', align: 'left' as const, sortable: true },
  { name: 'preco', label: 'Preco', field: 'preco', align: 'left' as const, sortable: true },
  { name: 'actions', label: 'Acoes', field: 'id', align: 'right' as const },
]

const authStore = useAuthStore()
const ordersStore = useOrdersStore()
const productsStore = useProductsStore()
const $q = useQuasar()
const router = useRouter()

const { token } = storeToRefs(authStore)
const { openTotal, receivedTotal } = storeToRefs(ordersStore)
const { deletingId, errorMessage, items, loading, saving } = storeToRefs(productsStore)

const confirmDialog = useConfirmDialog()
const dialogOpen = ref(false)
const editingProductId = ref('')
const dialogFormRef = ref<InstanceType<typeof QForm> | null>(null)
const productForm = ref({ nome: '', preco: '' })
const pendingDeleteProductId = ref('')

const productNameRules = [
  (value: string | number | null | undefined) => Boolean(String(value ?? '').trim()) || 'Informe o nome do produto',
]

const productPriceRules = [
  (value: string | number | null | undefined) => Boolean(String(value ?? '').trim()) || 'Informe o preco do produto',
  (value: string | number | null | undefined) => {
    const parsedPrice = Number(String(value ?? '').replace(',', '.'))
    return Number.isFinite(parsedPrice) && parsedPrice >= 0 ? true : 'Informe um preco valido'
  },
]

const dialogTitle = computed(() =>
  editingProductId.value ? 'Editar produto' : 'Novo produto',
)

const dialogSubmitLabel = computed(() => (editingProductId.value ? 'Salvar alteracoes' : 'Cadastrar produto'))

const canSubmitProductForm = computed(() => {
  return !saving.value && Boolean(productForm.value.nome.trim()) && Boolean(productForm.value.preco.trim())
})

watch(errorMessage, (message) => {
  if (!message) {
    return
  }

  $q.notify({
    type: 'negative',
    message,
    position: 'top',
    timeout: 2600,
    progress: true,
  })
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

function resetProductForm() {
  productForm.value = { nome: '', preco: '' }
  editingProductId.value = ''
}

function openCreateDialog() {
  resetProductForm()
  dialogOpen.value = true
}

function openEditDialog(product: Product) {
  editingProductId.value = product.id
  productForm.value = {
    nome: product.nome,
    preco: String(product.preco),
  }
  dialogOpen.value = true
}

function closeDialog() {
  if (saving.value) {
    return
  }

  dialogOpen.value = false
  resetProductForm()
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

function getProductPayload() {
  return {
    nome: productForm.value.nome.trim(),
    preco: Number(productForm.value.preco.replace(',', '.')),
  }
}

async function handleSaveProduct() {
  if (!token.value || saving.value) {
    return
  }

  const isValid = (await dialogFormRef.value?.validate()) ?? false

  if (!isValid) {
    $q.notify({
      type: 'warning',
      message: 'Preencha nome e preco corretamente para salvar o produto.',
      position: 'top',
      timeout: 2200,
      progress: true,
    })
    return
  }

  const payload = getProductPayload()

  try {
    if (editingProductId.value) {
      await productsStore.updateExistingProduct(token.value, editingProductId.value, payload)
      $q.notify({ type: 'positive', message: 'Produto atualizado com sucesso.', position: 'top', timeout: 2200 })
    } else {
      await productsStore.createNewProduct(token.value, payload)
      $q.notify({ type: 'positive', message: 'Produto cadastrado com sucesso.', position: 'top', timeout: 2200 })
    }

    dialogOpen.value = false
    resetProductForm()
  } catch {
    return
  }
}

async function handleDeleteProduct(productId: string) {
  pendingDeleteProductId.value = productId

  await confirmDialog.ask({
    title: 'Excluir produto',
    message: 'Deseja excluir esse produto?',
    confirmLabel: 'Excluir',
    cancelLabel: 'Cancelar',
    tone: 'danger',
  })
}

async function handleConfirmDelete() {
  if (!token.value || !pendingDeleteProductId.value) {
    confirmDialog.cancel()
    return
  }

  try {
    await productsStore.removeProduct(token.value, pendingDeleteProductId.value)
    $q.notify({ type: 'positive', message: 'Produto excluido com sucesso.', position: 'top', timeout: 2200 })
    confirmDialog.finish()
    pendingDeleteProductId.value = ''
  } catch {
    confirmDialog.cancel()
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
.products-layout {
  background: linear-gradient(180deg, #f8f1ff 0%, #efe0ff 100%);
}

.products-page {
  padding: 14px;
}

.products-card,
.product-dialog {
  border-radius: 28px;
  background: rgba(255, 255, 255, 0.97);
  box-shadow: 0 22px 48px rgba(76, 29, 149, 0.12);
}

.products-card__header {
  display: flex;
  justify-content: center;
}

.product-dialog h2 {
  margin: 0;
  color: #3b0764;
  text-align: center;
}

.products-table__actions {
  display: flex;
  justify-content: flex-end;
  gap: 6px;
}

.product-dialog {
  width: min(100vw - 24px, 520px);
}

.product-dialog__form {
  display: grid;
  gap: 18px;
}

.product-dialog__actions {
  display: grid;
  gap: 12px;
}

@media (min-width: 641px) {
  .products-page {
    padding: 20px;
  }

  .product-dialog__actions {
    grid-template-columns: 1fr 1fr;
  }
}
</style>
