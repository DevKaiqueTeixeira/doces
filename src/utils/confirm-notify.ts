import type { QVueGlobals } from 'quasar'

export interface ConfirmNotifyOptions {
  message: string
  caption?: string
  confirmLabel?: string
  cancelLabel?: string
}

export function showConfirmNotify($q: QVueGlobals, options: ConfirmNotifyOptions) {
  return new Promise<boolean>((resolve) => {
    let settled = false

    const dismiss = $q.notify({
      type: 'warning',
      message: options.message,
      caption: options.caption,
      multiLine: true,
      timeout: 0,
      progress: false,
      actions: [
        {
          label: options.cancelLabel ?? 'Cancelar',
          color: 'white',
          handler: () => {
            if (settled) {
              return
            }

            settled = true
            dismiss()
            resolve(false)
          },
        },
        {
          label: options.confirmLabel ?? 'Confirmar',
          color: 'yellow-3',
          handler: () => {
            if (settled) {
              return
            }

            settled = true
            dismiss()
            resolve(true)
          },
        },
      ],
      onDismiss: () => {
        if (settled) {
          return
        }

        settled = true
        resolve(false)
      },
    })
  })
}
