import { ref } from 'vue'

export interface ConfirmDialogOptions {
  title?: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  tone?: 'primary' | 'danger' | 'success'
}

export function useConfirmDialog() {
  const open = ref(false)
  const loading = ref(false)
  const options = ref<ConfirmDialogOptions>({
    title: '',
    message: '',
    confirmLabel: 'Confirmar',
    cancelLabel: 'Cancelar',
    tone: 'primary',
  })

  let resolver: ((value: boolean) => void) | null = null

  function ask(nextOptions: ConfirmDialogOptions) {
    options.value = {
      title: '',
      confirmLabel: 'Confirmar',
      cancelLabel: 'Cancelar',
      tone: 'primary',
      ...nextOptions,
    }
    open.value = true
    loading.value = false

    return new Promise<boolean>((resolve) => {
      resolver = resolve
    })
  }

  function cancel() {
    open.value = false
    loading.value = false
    resolver?.(false)
    resolver = null
  }

  function confirm() {
    loading.value = true
    return () => {
      open.value = false
      loading.value = false
      resolver?.(true)
      resolver = null
    }
  }

  function finish() {
    open.value = false
    loading.value = false
    resolver?.(true)
    resolver = null
  }

  return {
    ask,
    cancel,
    confirm,
    finish,
    loading,
    open,
    options,
  }
}
