<template>
  <main class="login-page">
    <div class="login-page__halo login-page__halo--left"></div>
    <div class="login-page__halo login-page__halo--right"></div>

    <QCard flat class="login-card app-surface-card">
      <section class="login-card__body">
        <span class="app-eyebrow login-card__eyebrow">Acesso interno</span>

        <div class="login-brand" aria-label="Jessy Doces">
          <span class="login-brand__jessy">Jessy</span>
          <span class="login-brand__doces">Doces</span>
        </div>

        <div class="login-card__copy">
          <h1>Entrar no painel</h1>
          <p>
            Acesse o painel interno para cadastrar pedidos, acompanhar pagamentos e manter o
            catalogo organizado no dia a dia.
          </p>
        </div>

        <QForm ref="formRef" class="login-form" @submit.prevent="handleSubmit">
          <BaseInput
            v-model="form.nome"
            label="Usuario"
            icon="person_outline"
            placeholder="Digite seu usuario"
            autocomplete="username"
            :rules="usuarioRules"
            :disabled="isLoading"
          />

          <BaseInput
            v-model="form.senha"
            type="password"
            label="Senha"
            icon="key"
            placeholder="Digite sua senha"
            autocomplete="current-password"
            :rules="senhaRules"
            :disabled="isLoading"
          />

          <BaseButton
            label="Entrar"
            type="submit"
            icon-right="east"
            :loading="isLoading"
            :disabled="!canSubmit"
          />
        </QForm>
      </section>
    </QCard>
  </main>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { QCard, QForm, useQuasar } from 'quasar'
import { useRoute, useRouter } from 'vue-router'

import BaseButton from '../components/base/BaseButton.vue'
import BaseInput from '../components/base/BaseInput.vue'
import { useAuthStore } from '../stores/auth'

const authStore = useAuthStore()
const $q = useQuasar()
const route = useRoute()
const router = useRouter()
const { errorMessage, status } = storeToRefs(authStore)

const formRef = ref<InstanceType<typeof QForm> | null>(null)

const form = ref({
  nome: '',
  senha: '',
})

const usuarioRules = [
  (value: string | number | null | undefined) => Boolean(String(value ?? '').trim()) || 'Informe o usuario',
]

const senhaRules = [
  (value: string | number | null | undefined) => Boolean(String(value ?? '')) || 'Informe a senha',
  (value: string | number | null | undefined) =>
    String(value ?? '').length >= 4 || 'A senha precisa ter pelo menos 4 caracteres',
]

const isLoading = computed(() => status.value === 'loading')

const canSubmit = computed(() => {
  return !isLoading.value && Boolean(form.value.nome.trim()) && Boolean(form.value.senha)
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

async function handleSubmit() {
  if (isLoading.value) {
    return
  }

  const isValid = (await formRef.value?.validate()) ?? false

  if (!isValid) {
    $q.notify({
      type: 'warning',
      message: 'Preencha usuario e senha corretamente antes de entrar.',
      position: 'top',
      timeout: 2200,
      progress: true,
    })
    return
  }

  const user = await authStore.login({
    nome: form.value.nome.trim(),
    senha: form.value.senha,
  })

  if (!user) {
    return
  }

  const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : '/'
  await router.replace(redirect)
}
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  padding: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
  background:
    radial-gradient(circle at top left, rgba(124, 58, 237, 0.18), transparent 32%),
    radial-gradient(circle at bottom right, rgba(216, 180, 254, 0.24), transparent 32%),
    linear-gradient(180deg, #fdfcff 0%, #f7f4ff 48%, #f3efff 100%);
}

.login-page__halo {
  position: absolute;
  border-radius: 50%;
  filter: blur(24px);
  opacity: 0.74;
}

.login-page__halo--left {
  top: -140px;
  left: -100px;
  width: 340px;
  height: 340px;
  background: radial-gradient(circle, rgba(124, 58, 237, 0.16), rgba(124, 58, 237, 0));
}

.login-page__halo--right {
  right: -140px;
  bottom: -160px;
  width: 400px;
  height: 400px;
  background: radial-gradient(circle, rgba(216, 180, 254, 0.22), rgba(216, 180, 254, 0));
}

.login-card {
  width: min(100%, 460px);
  position: relative;
  z-index: 1;
  overflow: hidden;
  font-family: var(--app-font-sans);
}

.login-card__body {
  position: relative;
  padding: 34px;
  display: grid;
  gap: 22px;
  background:
    radial-gradient(circle at top right, rgba(255, 255, 255, 0.72), transparent 34%),
    linear-gradient(180deg, rgba(124, 58, 237, 0.08), rgba(255, 255, 255, 0.22));
}

.login-card__body::after {
  content: '';
  position: absolute;
  inset: 18px 18px auto auto;
  width: 120px;
  height: 120px;
  border-radius: 28px;
  background: linear-gradient(135deg, rgba(124, 58, 237, 0.12), rgba(255, 255, 255, 0));
}

.login-card__eyebrow {
  position: relative;
  z-index: 1;
  justify-self: center;
}

.login-brand {
  display: grid;
  gap: 2px;
  position: relative;
  z-index: 1;
  justify-items: center;
  text-align: center;
}

.login-brand__jessy {
  color: var(--app-primary-strong, #6d28d9);
  font-family: var(--app-font-script);
  font-size: clamp(3.4rem, 10vw, 5.2rem);
  line-height: 0.75;
  letter-spacing: 0.01em;
}

.login-brand__doces {
  color: var(--app-title, #170f26);
  font-family: var(--app-font-display);
  font-size: clamp(1.8rem, 4vw, 2.6rem);
  font-weight: 700;
  letter-spacing: -0.05em;
  text-transform: uppercase;
}

.login-card__copy {
  position: relative;
  z-index: 1;
  display: grid;
  gap: 12px;
  text-align: center;
}

.login-card__copy h1 {
  margin: 0;
  color: var(--app-title, #170f26);
  font-family: var(--app-font-display);
  font-size: clamp(1.8rem, 6vw, 2.5rem);
  font-weight: 700;
  line-height: 1.08;
  letter-spacing: -0.05em;
}

.login-card__copy p {
  margin: 0;
  color: var(--app-text-soft, #6d6580);
  font-size: 0.98rem;
  line-height: 1.8;
}

.login-form {
  display: grid;
  gap: 20px;
}

@media (max-width: 640px) {
  .login-page {
    padding: 16px;
  }

  .login-card__body {
    padding: 26px;
  }
}
</style>
