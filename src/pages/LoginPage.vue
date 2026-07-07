<script setup lang="ts">
import { ref } from 'vue'
import { storeToRefs } from 'pinia'
import { QBtn, QCard, QCardSection, QForm, QInput } from 'quasar'
import { useRoute, useRouter } from 'vue-router'

import logoJessy from '../assets/logoJessy.png'
import { useAuthStore } from '../stores/auth'

const authStore = useAuthStore()
const route = useRoute()
const router = useRouter()
const { errorMessage, status } = storeToRefs(authStore)

const form = ref({
  nome: '',
  senha: '',
})

async function handleSubmit() {
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

<template>
  <main class="login-page">
    <section class="login-hero">
      <div class="login-copy">
        <span class="login-badge">Painel interno</span>
        <h1>JESSYDOCES</h1>
        <p>
          Entre com um dos usuarios cadastrados no Supabase para registrar a autoria das acoes e
          gerir os pedidos de trufas.
        </p>
      </div>

      <div class="login-brand">
        <img :src="logoJessy" alt="Logo JessyDoces" class="login-logo" />
      </div>
    </section>

    <QCard flat class="login-card">
      <QCardSection>
        <span class="login-card__label">Acesso restrito</span>
        <h2>Login dos operadores</h2>
        <p>Esta sessao fica salva no navegador para identificar quem realizou cada operacao.</p>
      </QCardSection>

      <QCardSection>
        <QForm class="login-form" @submit.prevent="handleSubmit">
          <QInput
            v-model="form.nome"
            outlined
            standout
            label="Nome do usuario"
            autocomplete="username"
            color="primary"
            dark
            lazy-rules
            :rules="[(value) => Boolean(value) || 'Informe o usuario']"
          />

          <QInput
            v-model="form.senha"
            outlined
            standout
            label="Senha"
            type="password"
            autocomplete="current-password"
            color="primary"
            dark
            lazy-rules
            :rules="[(value) => Boolean(value) || 'Informe a senha']"
          />

          <p v-if="errorMessage" class="login-error">{{ errorMessage }}</p>

          <QBtn
            class="login-submit"
            color="primary"
            text-color="white"
            unelevated
            no-caps
            label="Entrar no painel"
            type="submit"
            :loading="status === 'loading'"
          />
        </QForm>
      </QCardSection>
    </QCard>
  </main>
</template>

<style scoped>
.login-page {
  min-height: 100vh;
  padding: 32px;
  display: grid;
  grid-template-columns: minmax(0, 1.1fr) minmax(360px, 460px);
  gap: 28px;
  align-items: center;
  background:
    radial-gradient(circle at top left, rgba(216, 180, 254, 0.26), transparent 34%),
    radial-gradient(circle at bottom right, rgba(167, 139, 250, 0.24), transparent 30%),
    linear-gradient(180deg, #2d1240 0%, #150b25 100%);
}

.login-hero,
.login-card {
  background: rgba(46, 16, 70, 0.78);
  border: 1px solid rgba(233, 213, 255, 0.16);
  border-radius: 32px;
  box-shadow: 0 24px 60px rgba(12, 4, 24, 0.36);
  backdrop-filter: blur(16px);
}

.login-hero {
  min-height: 640px;
  padding: 40px;
  display: grid;
  grid-template-rows: 1fr auto;
  gap: 28px;
}

.login-copy {
  align-self: start;
}

.login-badge,
.login-card__label {
  display: inline-flex;
  margin-bottom: 14px;
  text-transform: uppercase;
  letter-spacing: 0.18em;
  font-size: 0.72rem;
  color: #e9d5ff;
}

.login-copy h1,
.login-card h2 {
  margin: 0 0 16px;
  color: #fff7ff;
}

.login-copy h1 {
  font-size: clamp(2.8rem, 6vw, 5rem);
  line-height: 0.94;
  letter-spacing: 0.08em;
}

.login-copy p,
.login-card p {
  margin: 0;
  max-width: 520px;
  color: #eadcf6;
  font-size: 1rem;
  line-height: 1.7;
}

.login-brand {
  display: flex;
  justify-content: center;
  align-items: flex-end;
}

.login-logo {
  width: min(100%, 360px);
  object-fit: contain;
  filter: drop-shadow(0 18px 40px rgba(0, 0, 0, 0.3));
}

.login-card {
  padding: 8px;
}

.login-form {
  display: grid;
  gap: 18px;
}

.login-error {
  margin: 0;
  padding: 12px 14px;
  border-radius: 16px;
  background: rgba(127, 29, 29, 0.32);
  color: #fecaca;
}

.login-submit {
  min-height: 52px;
  border-radius: 18px;
  background: linear-gradient(135deg, #c084fc 0%, #9333ea 100%);
}

@media (max-width: 960px) {
  .login-page {
    padding: 18px;
    grid-template-columns: 1fr;
  }

  .login-hero,
  .login-card {
    border-radius: 24px;
  }

  .login-hero {
    min-height: auto;
    padding: 28px;
  }

  .login-copy h1 {
    font-size: 2.8rem;
  }

  .login-logo {
    width: min(100%, 240px);
  }
}
</style>
