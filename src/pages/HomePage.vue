<template>
  <QLayout view="lHh Lpr lFf" class="home-layout">
    <QHeader class="home-header" elevated>
      <QToolbar class="home-toolbar">
        <QToolbarTitle class="home-title">Jessy Doces</QToolbarTitle>

        <QBtn
          flat
          no-caps
          icon="inventory_2"
          label="Cadastrar produto"
          class="home-toolbar__action"
          @click="openCreateDialog"
        />

        <QBtn flat round icon="logout" aria-label="Sair" @click="handleLogout" />
      </QToolbar>
    </QHeader>

    <QPageContainer>
      <QPage class="home-page">
        <QCard flat class="products-card">
          <QCardSection class="products-card__header">
            <div>
              <span class="products-card__eyebrow">Produtos</span>
              <h1>Lista de produtos cadastrados</h1>
            </div>

            <QBtn
              color="primary"
              text-color="white"
              unelevated
              no-caps
              icon="add"
              label="Cadastrar novo produto"
              @click="openCreateDialog"
            />
          </QCardSection>

          <QSeparator />

          <QCardSection>
            <div v-if="loading" class="products-empty">
              <QSpinner color="primary" size="42px" />
              <span>Carregando produtos...</span>
            </div>

            <div v-else-if="!items.length" class="products-empty">
              <QIcon name="inventory_2" color="primary" size="42px" />
              <span>Nenhum produto cadastrado ainda.</span>
            </div>

            <QTable
              v-else
              flat
              bordered
              :rows="items"
              :columns="columns"
              row-key="id"
              hide-bottom
              class="products-table"
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
                    @click="handleDeleteProduct(props.row.id, props.row.nome)"
                  />
                </QTd>
              </template>
            </QTable>
          </QCardSection>
        </QCard>
      </QPage>
    </QPageContainer>

    <QDialog v-model="dialogOpen" persistent>
      <QCard flat class="product-dialog">
        <QCardSection>
          <span class="products-card__eyebrow">Produto</span>
          <h2>{{ dialogTitle }}</h2>
        </QCardSection>

        <QCardSection>
          <QForm ref="dialogFormRef" class="product-dialog__form" @submit.prevent="handleSaveProduct">
            <BaseInput
              v-model="productForm.nome"
              label="Nome do produto"
              icon="cake"
              placeholder="Ex.: Trufa de morango"
              autocomplete="off"
              :rules="productNameRules"
              :disabled="saving"
            />

            <BaseInput
              v-model="productForm.preco"
              type="number"
              label="Preco"
              icon="attach_money"
              placeholder="Ex.: 7.50"
              autocomplete="off"
              :rules="productPriceRules"
              :disabled="saving"
            />

            <div class="product-dialog__actions">
              <QBtn flat no-caps label="Cancelar" :disable="saving" @click="closeDialog" />
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
  </QLayout>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import {
  QBtn,
  QCard,
  QCardSection,
  QDialog,
  QForm,
  QHeader,
  QIcon,
  QLayout,
  QPage,
  QPageContainer,
  QSeparator,
  QSpinner,
  QTable,
  QTd,
  QToolbar,
  QToolbarTitle,
  useQuasar,
} from 'quasar'
import { useRouter } from 'vue-router'

import BaseButton from '../components/base/BaseButton.vue'
import BaseInput from '../components/base/BaseInput.vue'
import { useAuthStore } from '../stores/auth'
import { useProductsStore } from '../stores/products'
import type { Product } from '../types/products'

const columns = [
  {
    name: 'nome',
    label: 'Produto',
    field: 'nome',
    align: 'left' as const,
    sortable: true,
  },
  {
    name: 'preco',
    label: 'Preco',
    field: 'preco',
    align: 'left' as const,
    sortable: true,
  },
  {
    name: 'actions',
    label: 'Acoes',
    field: 'id',
    align: 'right' as const,
  },
]

const authStore = useAuthStore()
const productsStore = useProductsStore()
const $q = useQuasar()
const router = useRouter()

const { token } = storeToRefs(authStore)
const { deletingId, errorMessage, items, loading, saving } = storeToRefs(productsStore)

const dialogOpen = ref(false)
const editingProductId = ref('')
const dialogFormRef = ref<InstanceType<typeof QForm> | null>(null)

const productForm = ref({
  nome: '',
  preco: '',
})

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
  editingProductId.value ? 'Editar produto cadastrado' : 'Cadastrar novo produto',
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
  const hasValidSession = await authStore.ensureValidSession()

  if (!hasValidSession || !token.value) {
    await router.replace('/login')
    return
  }

  try {
    await productsStore.loadProducts(token.value)
  } catch {
    return
  }
})

function resetProductForm() {
  productForm.value = {
    nome: '',
    preco: '',
  }
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
      $q.notify({
        type: 'positive',
        message: 'Produto atualizado com sucesso.',
        position: 'top',
        timeout: 2200,
      })
    } else {
      await productsStore.createNewProduct(token.value, payload)
      $q.notify({
        type: 'positive',
        message: 'Produto cadastrado com sucesso.',
        position: 'top',
        timeout: 2200,
      })
    }

    dialogOpen.value = false
    resetProductForm()
  } catch {
    return
  }
}

async function handleDeleteProduct(productId: string, productName: string) {
  if (!token.value) {
    return
  }

  const shouldDelete = window.confirm(`Deseja excluir o produto "${productName}"?`)

  if (!shouldDelete) {
    return
  }

  try {
    await productsStore.removeProduct(token.value, productId)
    $q.notify({
      type: 'positive',
      message: 'Produto excluido com sucesso.',
      position: 'top',
      timeout: 2200,
    })
  } catch {
    return
  }
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

.home-header {
  background: linear-gradient(135deg, #4c1d95 0%, #7c3aed 100%);
}

.home-toolbar {
  min-height: 72px;
  padding-inline: 20px;
}

.home-title {
  font-size: 1.25rem;
  font-weight: 800;
  letter-spacing: 0.02em;
}

.home-toolbar__action {
  margin-right: 8px;
  border-radius: 14px;
}

.home-page {
  padding: 28px;
}

.products-card,
.product-dialog {
  border-radius: 28px;
  background: rgba(255, 255, 255, 0.96);
  box-shadow: 0 22px 48px rgba(76, 29, 149, 0.12);
}

.products-card__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.products-card__eyebrow {
  display: inline-flex;
  margin-bottom: 10px;
  color: #9333ea;
  font-size: 0.74rem;
  font-weight: 700;
  letter-spacing: 0.18em;
  text-transform: uppercase;
}

.products-card h1,
.product-dialog h2 {
  margin: 0;
  color: #3b0764;
}

.products-empty {
  min-height: 280px;
  display: grid;
  place-items: center;
  gap: 14px;
  color: #6b21a8;
  text-align: center;
}

.products-table {
  border-radius: 20px;
  overflow: hidden;
}

.products-table__actions {
  display: flex;
  justify-content: flex-end;
  gap: 6px;
}

.product-dialog {
  width: min(100vw - 32px, 520px);
}

.product-dialog__form {
  display: grid;
  gap: 18px;
}

.product-dialog__actions {
  display: grid;
  grid-template-columns: 120px 1fr;
  gap: 12px;
  align-items: center;
}

@media (max-width: 900px) {
  .home-page {
    padding: 16px;
  }

  .products-card__header {
    flex-direction: column;
    align-items: flex-start;
  }
}

@media (max-width: 640px) {
  .home-toolbar {
    padding-inline: 10px;
  }

  .home-title {
    font-size: 1.05rem;
  }

  .product-dialog__actions {
    grid-template-columns: 1fr;
  }
}
</style>
