<template>
  <main class="login-page">
    <div class="login-orb"></div>

    <QCard flat class="login-card">
      <QCardSection class="login-card__header">
        <div class="login-card__icon-shell">
          <QIcon name="storefront" size="32px" color="primary" />
        </div>

        <span class="login-card__eyebrow">Acesso interno</span>
        <h1>jessy doces</h1>
        <p>Entre com um dos usuarios cadastrados para acessar o painel.</p>
      </QCardSection>

      <QCardSection>
        <QForm ref="formRef" class="login-form" @submit.prevent="handleSubmit">
          <QInput
            v-model="form.nome"
            outlined
            label="Usuario"
            autocomplete="username"
            color="primary"
            bg-color="white"
            input-class="login-input__field"
            lazy-rules="ondemand"
            :rules="usuarioRules"
          >
            <template #prepend>
              <QIcon name="person_outline" color="primary" />
            </template>
          </QInput>

          <QInput
            v-model="form.senha"
            outlined
            label="Senha"
            :type="showPassword ? 'text' : 'password'"
            autocomplete="current-password"
            color="primary"
            bg-color="white"
            input-class="login-input__field"
            lazy-rules="ondemand"
            :rules="senhaRules"
          >
            <template #prepend>
              <QIcon name="key" color="primary" />
            </template>

            <template #append>
              <QIcon
                :name="showPassword ? 'visibility_off' : 'visibility'"
                color="primary"
                class="login-input__action"
                @click="showPassword = !showPassword"
              />
            </template>
          </QInput>

          <p class="login-form__helper">Use um dos acessos internos cadastrados no Supabase.</p>

          <QBtn
            class="login-submit"
            color="primary"
            text-color="white"
            unelevated
            no-caps
            label="Entrar"
            type="submit"
            icon-right="east"
            :loading="status === 'loading'"
          />
        </QForm>
      </QCardSection>
    </QCard>
  </main>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { QBtn, QCard, QCardSection, QForm, QIcon, QInput, useQuasar } from 'quasar'
import { useRoute, useRouter } from 'vue-router'

import { useAuthStore } from '../stores/auth'

const authStore = useAuthStore()
const $q = useQuasar()
const route = useRoute()
const router = useRouter()
const { errorMessage, status } = storeToRefs(authStore)

const formRef = ref<InstanceType<typeof QForm> | null>(null)
const showPassword = ref(false)

const form = ref({
  nome: '',
  senha: '',
})

const usuarioRules = [
  (value: string | null | undefined) => Boolean(value?.trim()) || 'Informe o usuario',
]

const senhaRules = [
  (value: string | null | undefined) => Boolean(value) || 'Informe a senha',
  (value: string | null | undefined) =>
    (value?.length ?? 0) >= 4 || 'A senha precisa ter pelo menos 4 caracteres',
]

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
    radial-gradient(circle at top, rgba(192, 132, 252, 0.12), transparent 35%),
    linear-gradient(180deg, #34114d 0%, #1a072a 100%);
}

.login-orb {
  width: 620px;
  height: 620px;
  position: absolute;
  border-radius: 50%;
  background: radial-gradient(
    circle,
    rgba(216, 180, 254, 0.95) 0%,
    rgba(192, 132, 252, 0.6) 45%,
    rgba(192, 132, 252, 0) 72%
  );
  filter: blur(18px);
  opacity: 0.78;
}

.login-card {
  width: min(100%, 420px);
  position: relative;
  z-index: 1;
  padding: 16px;
  border-radius: 30px;
  background: rgba(255, 255, 255, 0.92);
  box-shadow: 0 24px 70px rgba(20, 5, 33, 0.34);
}

.login-card__header {
  text-align: center;
  padding-bottom: 8px;
}

.login-card__icon-shell {
  width: 64px;
  height: 64px;
  margin: 0 auto 18px;
  display: grid;
  place-items: center;
  border-radius: 50%;
  background: linear-gradient(135deg, rgba(233, 213, 255, 0.95), rgba(216, 180, 254, 0.72));
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.65);
}

.login-card__eyebrow {
  display: inline-flex;
  margin-bottom: 14px;
  text-transform: uppercase;
  letter-spacing: 0.18em;
  font-size: 0.72rem;
  font-weight: 700;
  color: #9333ea;
}

.login-card h1 {
  margin: 0 0 12px;
  color: #3b0764;
  font-size: clamp(2rem, 5vw, 2.9rem);
  font-weight: 800;
  line-height: 0.96;
  letter-spacing: -0.04em;
  text-transform: lowercase;
}

.login-card p {
  margin: 0;
  color: #6b21a8;
  font-size: 0.96rem;
  font-weight: 500;
  line-height: 1.6;
}

.login-form {
  display: grid;
  gap: 18px;
  margin-top: 8px;
}

.login-form__helper {
  margin: -4px 2px 2px;
  color: #7e22ce;
  font-size: 0.84rem;
  line-height: 1.5;
}

.login-input__field {
  font-weight: 600;
  color: #3b0764;
}

.login-input__action {
  cursor: pointer;
  transition: transform 0.2s ease, opacity 0.2s ease;
}

.login-input__action:hover {
  transform: scale(1.06);
  opacity: 0.8;
}

.login-submit {
  width: 100%;
  min-height: 52px;
  border-radius: 18px;
  background: linear-gradient(135deg, #c084fc 0%, #9333ea 100%);
  font-size: 1rem;
  font-weight: 700;
  letter-spacing: 0.01em;
  transition: transform 0.2s ease, box-shadow 0.2s ease, filter 0.2s ease;
}

.login-submit:hover {
  transform: translateY(-1px);
  box-shadow: 0 16px 30px rgba(147, 51, 234, 0.28);
  filter: brightness(1.03);
}

.login-submit:focus-visible {
  outline: 2px solid rgba(147, 51, 234, 0.24);
  outline-offset: 3px;
}

@media (max-width: 960px) {
  .login-page {
    padding: 18px;
  }

  .login-orb {
    width: 420px;
    height: 420px;
  }
}
</style>
