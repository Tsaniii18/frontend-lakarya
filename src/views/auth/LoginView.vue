<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import AppLogo from '../../components/AppLogo.vue';
import {
  getApiErrorMessage,
  getDemoAccess,
  login,
  loginAsDemo,
} from '../../auth/auth';
import type { DemoPersona, DemoPersonaOption } from '../../auth/auth';

const route = useRoute();
const router = useRouter();
const email = ref('');
const password = ref('');
const loading = ref(false);
const demoLoading = ref(false);
const demoEnabled = ref(false);
const demoPersonas = ref<DemoPersonaOption[]>([]);
const selectedPersona = ref<DemoPersona | ''>('');
const errorMessage = ref('');
const accessMessage = ref(
  route.query.reason === 'session-expired'
    ? 'Sesi Anda telah berakhir. Silakan masuk kembali.'
    : route.query.reason === 'auth-required'
      ? 'Anda belum masuk. Silakan masuk terlebih dahulu untuk mengakses halaman tersebut.'
      : '',
);
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
    await continueAfterLogin();
  } catch (error) {
    errorMessage.value = getApiErrorMessage(error);
  } finally {
    loading.value = false;
  }
}

async function continueAfterLogin() {
  const redirect =
    typeof route.query.redirect === 'string'
      ? route.query.redirect
      : '/beranda';
  await router.push(redirect);
}

async function handleDemoLogin() {
  if (!selectedPersona.value) {
    errorMessage.value = 'Pilih akun demo yang ingin digunakan.';
    return;
  }

  demoLoading.value = true;
  errorMessage.value = '';

  try {
    await loginAsDemo(selectedPersona.value);
    await continueAfterLogin();
  } catch (error) {
    errorMessage.value = getApiErrorMessage(error);
  } finally {
    demoLoading.value = false;
  }
}

onMounted(async () => {
  try {
    const demoAccess = await getDemoAccess();
    demoEnabled.value = demoAccess.enabled;
    demoPersonas.value = demoAccess.personas;
    selectedPersona.value = demoAccess.personas[0]?.persona ?? '';
  } catch {
    demoEnabled.value = false;
  }
});
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

        <div v-if="accessMessage" class="mt-5 flex items-start justify-between gap-4 rounded-lg bg-[#e9f0f7] px-4 py-3 text-sm text-primary-soft" role="status">
          <p>{{ accessMessage }}</p>
          <button class="shrink-0 text-lg leading-none" type="button" aria-label="Tutup pemberitahuan" @click="accessMessage = ''">×</button>
        </div>
        <div v-if="errorMessage" class="mt-5 rounded-lg bg-[#f7e8e7] px-4 py-3 text-sm text-danger">
          {{ errorMessage }}
        </div>
        <div v-if="successMessage" class="mt-5 flex items-start justify-between gap-4 rounded-lg bg-[#e7f2ef] px-4 py-3 text-sm text-success" role="status">
          <p>{{ successMessage }}</p>
          <button class="shrink-0 text-lg leading-none" type="button" aria-label="Tutup pemberitahuan" @click="successMessage = ''">×</button>
        </div>

        <section v-if="demoEnabled" class="mt-6 rounded-xl border border-[#cad8e8] bg-[#f4f7fb] p-4">
          <div class="flex items-start gap-3">
            <span class="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary text-white" aria-hidden="true">
              <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                <path d="M8 3h8M9 3v4l-4 7a4 4 0 0 0 3.5 6h7a4 4 0 0 0 3.5-6l-4-7V3" />
                <path d="M7 14h10" />
              </svg>
            </span>
            <div>
              <h2 class="text-sm font-semibold text-primary">Coba akun demo</h2>
              <p class="mt-1 text-xs leading-5 text-text-muted">Pilih peran untuk menjelajahi tampilan dan wewenang yang berbeda tanpa memasukkan password.</p>
            </div>
          </div>

          <form class="mt-4 space-y-3" @submit.prevent="handleDemoLogin">
            <div>
              <label class="form-label" for="demo-persona">Masuk sebagai</label>
              <select id="demo-persona" v-model="selectedPersona" class="form-input" required>
                <option v-for="persona in demoPersonas" :key="persona.persona" :value="persona.persona">
                  {{ persona.label }} · {{ persona.department }}
                </option>
              </select>
            </div>
            <button class="secondary-button w-full" type="submit" :disabled="demoLoading || loading">
              {{ demoLoading ? 'Menyiapkan akun...' : 'Masuk sebagai akun demo' }}
            </button>
          </form>
        </section>

        <div v-if="demoEnabled" class="my-6 flex items-center gap-3 text-xs text-text-muted" aria-hidden="true">
          <span class="h-px flex-1 bg-border"></span>
          <span>atau masuk dengan akun Anda</span>
          <span class="h-px flex-1 bg-border"></span>
        </div>

        <form :class="demoEnabled ? 'space-y-5' : 'mt-7 space-y-5'" @submit.prevent="handleSubmit">
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

          <button class="primary-button w-full" type="submit" :disabled="loading || demoLoading">
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
