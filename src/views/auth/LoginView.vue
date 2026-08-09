<script setup lang="ts">
import { ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import AppLogo from '../../components/AppLogo.vue';
import { getApiErrorMessage, login } from '../../auth/auth';

const route = useRoute();
const router = useRouter();
const email = ref('');
const password = ref('');
const loading = ref(false);
const errorMessage = ref('');
const successMessage = ref(
  route.query.passwordChanged === '1'
    ? 'Password berhasil diubah. Silakan masuk kembali.'
    : '',
);

async function handleSubmit() {
  loading.value = true;
  errorMessage.value = '';

  try {
    await login(email.value, password.value);
    const redirect =
      typeof route.query.redirect === 'string'
        ? route.query.redirect
        : '/beranda';
    await router.push(redirect);
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
      <RouterLink class="mb-8 flex justify-center rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-soft" to="/">
        <span class="scale-[1.08]">
          <AppLogo />
        </span>
      </RouterLink>

      <section class="rounded-2xl border border-border bg-surface p-6 shadow-[0_18px_45px_rgba(15,39,71,0.08)] sm:p-8">
        <div>
          <p class="text-sm font-medium text-primary-soft">Portal Karyawan</p>
          <h1 class="mt-2 text-2xl font-semibold text-primary">Masuk ke LaKarya</h1>
          <p class="mt-2 text-sm leading-6 text-text-muted">
            Gunakan akun karyawan Anda untuk masuk ke portal.
          </p>
        </div>

        <div v-if="errorMessage" class="mt-5 rounded-lg bg-[#f7e8e7] px-4 py-3 text-sm text-danger">
          {{ errorMessage }}
        </div>
        <div v-if="successMessage" class="mt-5 flex items-start justify-between gap-4 rounded-lg bg-[#e7f2ef] px-4 py-3 text-sm text-success" role="status">
          <p>{{ successMessage }}</p>
          <button class="shrink-0 text-lg leading-none" type="button" aria-label="Tutup pemberitahuan" @click="successMessage = ''">×</button>
        </div>

        <form class="mt-7 space-y-5" @submit.prevent="handleSubmit">
          <div>
            <label class="form-label" for="email">Email</label>
            <input id="email" v-model="email" class="form-input" type="email" autocomplete="email" required placeholder="nama@perusahaan.com" />
          </div>

          <div>
            <label class="form-label" for="password">Password</label>
            <input id="password" v-model="password" class="form-input" type="password" autocomplete="current-password" required placeholder="Masukkan password" />
            <div class="mt-2 text-right">
              <RouterLink class="text-sm font-medium text-primary-soft hover:text-primary hover:underline" to="/lupa-password">Lupa password?</RouterLink>
            </div>
          </div>

          <button class="primary-button w-full" type="submit" :disabled="loading">
            {{ loading ? 'Memproses...' : 'Masuk' }}
          </button>
        </form>
      </section>

      <p class="mt-6 text-center text-sm text-text-muted">
        Belum punya akun?
        <RouterLink class="font-medium text-primary-soft hover:text-primary hover:underline" to="/daftar">Daftar</RouterLink>.
      </p>
    </div>
  </main>
</template>
