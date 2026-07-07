<template>
  <main class="login-page">
    <div class="login-orb"></div>

    <QCard flat class="login-card">
      <QCardSection class="login-card__header">
        <div class="login-card__media">
          <div class="login-card__media-topfade"></div>
          <div class="login-card__media-glow"></div>
          <img :src="logoJessy" alt="Jessy Doces" class="login-card__logo" />
          <div class="login-card__media-shine"></div>
        </div>

        <span class="login-card__eyebrow">Acesso interno</span>
        <h1>Painel de acesso</h1>
        <p>Entre com um dos usuarios cadastrados para acessar os pedidos e registrar as acoes do sistema.</p>
      </QCardSection>

      <QCardSection>
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

          <p class="login-form__helper">Use um dos acessos internos cadastrados no Supabase.</p>

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

import logoJessy from '../assets/jessyDoces.png'
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
    radial-gradient(circle at top, rgba(192, 132, 252, 0.18), transparent 35%),
    radial-gradient(circle at bottom, rgba(91, 33, 182, 0.2), transparent 30%),
    linear-gradient(180deg, #34114d 0%, #1a072a 100%);
}

.login-orb {
  width: 700px;
  height: 700px;
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
  width: min(100%, 430px);
  position: relative;
  z-index: 1;
  padding: 16px;
  border-radius: 32px;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.96), rgba(255, 255, 255, 0.92));
  box-shadow: 0 30px 80px rgba(20, 5, 33, 0.38);
  backdrop-filter: blur(10px);
}

.login-card__header {
  text-align: center;
  padding-bottom: 10px;
}

.login-card__media {
  position: relative;
  height: 186px;
  margin: -6px -6px 22px;
  border-radius: 24px;
  overflow: hidden;
  background:
    linear-gradient(180deg, rgba(88, 28, 135, 0.98), rgba(59, 7, 100, 0.98)),
    radial-gradient(circle at top, rgba(233, 213, 255, 0.52), transparent 45%);
}

.login-card__media-topfade {
  position: absolute;
  inset: 0 0 auto;
  height: 72px;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.1), transparent);
  z-index: 1;
}

.login-card__media-glow {
  position: absolute;
  left: 50%;
  bottom: 18px;
  width: 270px;
  height: 110px;
  transform: translateX(-50%);
  border-radius: 999px;
  background: radial-gradient(circle, rgba(216, 180, 254, 0.75), rgba(216, 180, 254, 0));
  filter: blur(18px);
  opacity: 0.95;
}

.login-card__media-shine {
  position: absolute;
  top: 14px;
  left: -40px;
  width: 140px;
  height: 220px;
  transform: rotate(18deg);
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.22), rgba(255, 255, 255, 0));
  filter: blur(8px);
}

.login-card__logo {
  position: absolute;
  left: 50%;
  bottom: 12px;
  width: min(100%, 320px);
  height: 132px;
  transform: translateX(-50%);
  object-fit: contain;
  filter: drop-shadow(0 18px 30px rgba(20, 5, 33, 0.48));
  z-index: 2;
}

.login-card__eyebrow {
  display: inline-flex;
  margin-bottom: 10px;
  text-transform: uppercase;
  letter-spacing: 0.22em;
  font-size: 0.7rem;
  font-weight: 700;
  color: #9333ea;
}

.login-card h1 {
  margin: 0 0 10px;
  color: #3b0764;
  font-size: clamp(1.8rem, 4.5vw, 2.5rem);
  font-weight: 800;
  line-height: 1;
  letter-spacing: -0.03em;
}

.login-card p {
  margin: 0;
  color: #6b21a8;
  font-size: 0.94rem;
  font-weight: 500;
  line-height: 1.65;
  max-width: 320px;
  margin-inline: auto;
}

.login-form {
  display: grid;
  gap: 18px;
  margin-top: 10px;
}

.login-form__helper {
  margin: -4px 2px 2px;
  color: #7e22ce;
  font-size: 0.84rem;
  line-height: 1.5;
}

@media (max-width: 960px) {
  .login-page {
    padding: 18px;
  }

  .login-orb {
    width: 420px;
    height: 420px;
  }

  .login-card__media {
    height: 154px;
  }

  .login-card__logo {
    width: min(100%, 260px);
    height: 110px;
  }
}
</style>
