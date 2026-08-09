<script setup lang="ts">
import { ref } from 'vue';
import { useRoute } from 'vue-router';
import AppLogo from '../../components/AppLogo.vue';
import api from '../../lib/api';
import { getApiErrorMessage } from '../../auth/auth';

const route = useRoute();
const password = ref('');
const repeatPassword = ref('');
const loading = ref(false);
const errorMessage = ref('');
const successMessage = ref('');

async function handleSubmit() {
  errorMessage.value = '';
  successMessage.value = '';

  if (password.value !== repeatPassword.value) {
    errorMessage.value = 'Ulangi password tidak sama.';
    return;
  }

  loading.value = true;

  try {
    const { data } = await api.post<{ message: string }>('/auth/reset-password', {
      token: typeof route.query.token === 'string' ? route.query.token : '',
      password: password.value,
      repeatPassword: repeatPassword.value,
    });
    successMessage.value = data.message;
    password.value = '';
    repeatPassword.value = '';
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
        <h1 class="mt-2 text-2xl font-semibold text-primary">Buat password baru</h1>
        <p class="mt-2 text-sm leading-6 text-text-muted">Masukkan password baru untuk akun Anda.</p>

        <div v-if="errorMessage" class="mt-5 rounded-lg bg-[#f7e8e7] px-4 py-3 text-sm text-danger">{{ errorMessage }}</div>
        <div v-if="successMessage" class="mt-5 rounded-lg bg-[#e7f2ef] px-4 py-3 text-sm text-success">{{ successMessage }}</div>

        <form class="mt-6 space-y-5" @submit.prevent="handleSubmit">
          <div>
            <label class="form-label" for="new-password">Password baru</label>
            <input id="new-password" v-model="password" class="form-input" type="password" autocomplete="new-password" required placeholder="Masukkan password baru" />
          </div>
          <div>
            <label class="form-label" for="repeat-new-password">Ulangi password baru</label>
            <input id="repeat-new-password" v-model="repeatPassword" class="form-input" type="password" autocomplete="new-password" required placeholder="Ulangi password baru" />
          </div>
          <button class="primary-button w-full" type="submit" :disabled="loading">
            {{ loading ? 'Menyimpan...' : 'Simpan password baru' }}
          </button>
        </form>
      </section>

      <p class="mt-6 text-center text-sm text-text-muted">
        Kembali ke
        <RouterLink class="font-medium text-primary-soft hover:text-primary hover:underline" to="/masuk">halaman masuk</RouterLink>.
      </p>
    </div>
  </main>
</template>
