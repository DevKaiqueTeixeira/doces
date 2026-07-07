import { ref } from 'vue'
import { defineStore } from 'pinia'

import { createProduct, deleteProduct, fetchProducts, updateProduct } from '../services/products'
import type { Product, ProductPayload } from '../types/products'

function sortProducts(products: Product[]) {
  return [...products].sort((left, right) => left.nome.localeCompare(right.nome, 'pt-BR'))
}

export const useProductsStore = defineStore('products', () => {
  const items = ref<Product[]>([])
  const errorMessage = ref('')
  const loading = ref(false)
  const saving = ref(false)
  const deletingId = ref('')

  async function loadProducts(token: string) {
    loading.value = true
    errorMessage.value = ''

    try {
      items.value = sortProducts(await fetchProducts(token))
      return items.value
    } catch (error) {
      errorMessage.value = error instanceof Error ? error.message : 'Falha ao carregar produtos.'
      throw error
    } finally {
      loading.value = false
    }
  }

  async function createNewProduct(token: string, payload: ProductPayload) {
    saving.value = true
    errorMessage.value = ''

    try {
      const produto = await createProduct(token, payload)
      items.value = sortProducts([...items.value, produto])
      return produto
    } catch (error) {
      errorMessage.value = error instanceof Error ? error.message : 'Falha ao cadastrar produto.'
      throw error
    } finally {
      saving.value = false
    }
  }

  async function updateExistingProduct(token: string, productId: string, payload: ProductPayload) {
    saving.value = true
    errorMessage.value = ''

    try {
      const produto = await updateProduct(token, productId, payload)
      items.value = sortProducts(
        items.value.map((currentProduct) => (currentProduct.id === productId ? produto : currentProduct)),
      )
      return produto
    } catch (error) {
      errorMessage.value = error instanceof Error ? error.message : 'Falha ao atualizar produto.'
      throw error
    } finally {
      saving.value = false
    }
  }

  async function removeProduct(token: string, productId: string) {
    deletingId.value = productId
    errorMessage.value = ''

    try {
      await deleteProduct(token, productId)
      items.value = items.value.filter((product) => product.id !== productId)
    } catch (error) {
      errorMessage.value = error instanceof Error ? error.message : 'Falha ao excluir produto.'
      throw error
    } finally {
      deletingId.value = ''
    }
  }

  return {
    createNewProduct,
    deletingId,
    errorMessage,
    items,
    loadProducts,
    loading,
    removeProduct,
    saving,
    updateExistingProduct,
  }
})
