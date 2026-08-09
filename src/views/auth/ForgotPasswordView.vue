<script setup lang="ts">
import { ref } from 'vue';
import AppLogo from '../../components/AppLogo.vue';
import api from '../../lib/api';
import { getApiErrorMessage } from '../../auth/auth';

const email = ref('');
const loading = ref(false);
const errorMessage = ref('');
const successMessage = ref('');

async function handleSubmit() {
  loading.value = true;
  errorMessage.value = '';
  successMessage.value = '';

  try {
    const { data } = await api.post<{ message: string }>('/auth/forgot-password', {
      email: email.value,
    });
    successMessage.value = data.message;
  } catch (error) {
    errorMessage.value = getApiErrorMessage(error);
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <main class="flex min-h-screen items-center justify-center bg-background px-5 py-12">
    <div class="w-full max-w-md">
      <RouterLink class="mb-8 flex justify-center" to="/">
        <span class="scale-[1.08]"><AppLogo /></span>
      </RouterLink>

      <section class="rounded-2xl border border-border bg-surface p-6 shadow-[0_18px_45px_rgba(15,39,71,0.08)] sm:p-8">
        <p class="text-sm font-medium text-primary-soft">Pemulihan Akun</p>
        <h1 class="mt-2 text-2xl font-semibold text-primary">Lupa password</h1>
        <p class="mt-2 text-sm leading-6 text-text-muted">Masukkan email yang terhubung dengan akun Anda.</p>

        <div v-if="errorMessage" class="mt-5 rounded-lg bg-[#f7e8e7] px-4 py-3 text-sm text-danger">{{ errorMessage }}</div>
        <div v-if="successMessage" class="mt-5 flex items-start justify-between gap-4 rounded-lg bg-[#e7f2ef] px-4 py-3 text-sm text-success" role="status">
          <p>{{ successMessage }}</p>
          <button class="shrink-0 text-lg leading-none" type="button" aria-label="Tutup pemberitahuan" @click="successMessage = ''">×</button>
        </div>

        <form class="mt-6 space-y-5" @submit.prevent="handleSubmit">
          <div>
            <label class="form-label" for="forgot-email">Email</label>
            <input id="forgot-email" v-model="email" class="form-input" type="email" autocomplete="email" required placeholder="nama@perusahaan.com" />
          </div>
          <button class="primary-button w-full" type="submit" :disabled="loading">
            {{ loading ? 'Memproses...' : 'Kirim permintaan reset' }}
          </button>
        </form>
      </section>

      <p class="mt-6 text-center text-sm text-text-muted">
        Ingat password?
        <RouterLink class="font-medium text-primary-soft hover:text-primary hover:underline" to="/masuk">Masuk</RouterLink>.
      </p>
    </div>
  </main>
</template>
