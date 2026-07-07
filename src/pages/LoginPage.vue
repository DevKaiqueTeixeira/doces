<template>
  <main class="login-page">
    <div class="login-glow login-glow--top"></div>
    <div class="login-glow login-glow--bottom"></div>

    <QCard flat class="login-card">
      <QCardSection class="login-card__header">
        <div class="login-brand" aria-label="Jessy Doces">
          <span class="login-brand__jessy">Jessy</span>
          <span class="login-brand__doces">Doces</span>
        </div>

        <span class="login-card__eyebrow">Acesso interno</span>
      </QCardSection>

      <QCardSection class="login-card__body">
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
      </QCardSection>
    </QCard>
  </main>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { QCard, QCardSection, QForm, useQuasar } from 'quasar'
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
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@600;700&family=Manrope:wght@500;600;700;800&family=Parisienne&display=swap');

.login-page {
  --login-display-font: 'Cormorant Garamond', Georgia, serif;
  --login-script-font: 'Parisienne', cursive;
  --login-sans-font: 'Manrope', Inter, system-ui, sans-serif;
  min-height: 100vh;
  padding: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
  background: linear-gradient(180deg, #3a1457 0%, #220a34 100%);
}

.login-glow {
  position: absolute;
  border-radius: 50%;
  filter: blur(18px);
  opacity: 0.72;
}

.login-glow--top {
  top: -120px;
  left: -80px;
  width: 320px;
  height: 320px;
  background: radial-gradient(circle, rgba(233, 213, 255, 0.54), rgba(233, 213, 255, 0));
}

.login-glow--bottom {
  right: -100px;
  bottom: -140px;
  width: 380px;
  height: 380px;
  background: radial-gradient(circle, rgba(192, 132, 252, 0.42), rgba(192, 132, 252, 0));
}

.login-card {
  width: min(100%, 440px);
  position: relative;
  z-index: 1;
  overflow: hidden;
  border-radius: 32px;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(250, 245, 255, 0.94));
  box-shadow: 0 32px 80px rgba(20, 5, 33, 0.34);
  border: 1px solid rgba(233, 213, 255, 0.8);
  font-family: var(--login-sans-font);
}

.login-card::before,
.login-card::after {
  content: '';
  position: absolute;
  top: 18px;
  bottom: 18px;
  width: 8px;
  border-radius: 999px;
  background: linear-gradient(180deg, rgba(216, 180, 254, 0.2), rgba(147, 51, 234, 0.95), rgba(216, 180, 254, 0.22));
  box-shadow: 0 0 18px rgba(168, 85, 247, 0.22);
}

.login-card::before {
  left: 14px;
}

.login-card::after {
  right: 14px;
}

.login-card__header {
  padding: 36px 42px 12px;
  text-align: center;
}

.login-brand {
  display: grid;
  gap: 0;
  justify-items: center;
  margin-bottom: 16px;
  color: #5b1f87;
}

.login-brand__jessy {
  font-family: var(--login-script-font);
  font-size: clamp(3rem, 8vw, 4.5rem);
  line-height: 0.82;
  letter-spacing: 0.01em;
  color: #8b36d8;
  text-shadow: 0 8px 24px rgba(168, 85, 247, 0.18);
}

.login-brand__doces {
  margin-top: -4px;
  font-family: var(--login-display-font);
  font-size: clamp(2rem, 5vw, 2.7rem);
  font-weight: 700;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: #4c1779;
}

.login-card__eyebrow {
  display: inline-flex;
  margin-bottom: 10px;
  color: #a855f7;
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.24em;
  text-transform: uppercase;
}

.login-card__body {
  padding: 18px 42px 36px;
}

.login-form {
  display: grid;
  gap: 20px;
}

@media (max-width: 640px) {
  .login-page {
    padding: 16px;
  }

  .login-card {
    border-radius: 26px;
  }

  .login-card::before,
  .login-card::after {
    top: 14px;
    bottom: 14px;
    width: 6px;
  }

  .login-card::before {
    left: 10px;
  }

  .login-card::after {
    right: 10px;
  }

  .login-card__header {
    padding: 28px 28px 8px;
  }

  .login-card__body {
    padding: 16px 28px 26px;
  }
}
</style>
