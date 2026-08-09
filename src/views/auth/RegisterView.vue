<script setup lang="ts">
import { ref } from 'vue';
import AppLogo from '../../components/AppLogo.vue';
import api from '../../lib/api';
import { getApiErrorMessage } from '../../auth/auth';

const employeeNumber = ref('');
const name = ref('');
const email = ref('');
const department = ref('');
const password = ref('');
const repeatPassword = ref('');
const loading = ref(false);
const errorMessage = ref('');
const successMessage = ref('');

async function handleSubmit() {
  errorMessage.value = '';
  successMessage.value = '';

  if (password.value.length < 6) {
    errorMessage.value = 'Password minimal 6 karakter.';
    return;
  }

  if (password.value !== repeatPassword.value) {
    errorMessage.value = 'Ulangi password tidak sama.';
    return;
  }

  loading.value = true;

  try {
    const { data } = await api.post<{ message: string }>('/auth/register', {
      employeeNumber: employeeNumber.value,
      name: name.value,
      email: email.value,
      department: department.value,
      password: password.value,
      repeatPassword: repeatPassword.value,
    });
    successMessage.value = data.message;
    employeeNumber.value = '';
    name.value = '';
    email.value = '';
    department.value = '';
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
  <main class="flex min-h-screen items-center justify-center bg-background px-5 py-10">
    <div class="w-full max-w-lg">
      <RouterLink class="mb-7 flex justify-center rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-soft" to="/">
        <span class="scale-[1.08]">
          <AppLogo />
        </span>
      </RouterLink>

      <section class="rounded-2xl border border-border bg-surface p-6 shadow-[0_18px_45px_rgba(15,39,71,0.08)] sm:p-8">
        <div>
          <p class="text-sm font-medium text-primary-soft">Portal Karyawan</p>
          <h1 class="mt-2 text-2xl font-semibold text-primary">Buat akun LaKarya</h1>
          <p class="mt-2 text-sm leading-6 text-text-muted">
            Isi data berikut untuk menyiapkan akun karyawan Anda.
          </p>
        </div>

        <div v-if="errorMessage" class="mt-5 rounded-lg bg-[#f7e8e7] px-4 py-3 text-sm text-danger">
          {{ errorMessage }}
        </div>
        <div v-if="successMessage" class="mt-5 rounded-lg bg-[#e7f2ef] px-4 py-3 text-sm text-success">
          {{ successMessage }}
        </div>

        <form class="mt-7 grid gap-5 sm:grid-cols-2" @submit.prevent="handleSubmit">
          <div class="sm:col-span-2">
            <label class="form-label" for="employee-number">Nomor pegawai</label>
            <input id="employee-number" v-model="employeeNumber" class="form-input" type="text" autocomplete="off" required placeholder="Masukkan nomor pegawai" />
          </div>

          <div class="sm:col-span-2">
            <label class="form-label" for="name">Nama lengkap</label>
            <input id="name" v-model="name" class="form-input" type="text" autocomplete="name" required placeholder="Masukkan nama lengkap" />
          </div>

          <div class="sm:col-span-2">
            <label class="form-label" for="register-email">Email</label>
            <input id="register-email" v-model="email" class="form-input" type="email" autocomplete="email" required placeholder="nama@perusahaan.com" />
          </div>

          <div class="sm:col-span-2">
            <label class="form-label" for="department">Departemen</label>
            <select id="department" v-model="department" class="form-input bg-white" required>
              <option value="">Pilih departemen</option>
              <option value="Human Resources">Human Resources</option>
              <option value="Finance">Finance</option>
              <option value="Information Technology">Information Technology</option>
              <option value="Marketing">Marketing</option>
            </select>
          </div>

          <div>
            <label class="form-label" for="register-password">Password</label>
            <input id="register-password" v-model="password" class="form-input" type="password" autocomplete="new-password" required minlength="6" placeholder="Masukkan password" />
            <p class="mt-2 text-xs text-text-muted">Minimal 6 karakter.</p>
          </div>

          <div>
            <label class="form-label" for="repeat-password">Ulangi password</label>
            <input id="repeat-password" v-model="repeatPassword" class="form-input" type="password" autocomplete="new-password" required minlength="6" placeholder="Ulangi password" />
          </div>

          <button class="primary-button w-full sm:col-span-2" type="submit" :disabled="loading">
            {{ loading ? 'Mendaftarkan...' : 'Daftar' }}
          </button>
        </form>
      </section>

      <p class="mt-6 text-center text-sm text-text-muted">
        Sudah punya akun?
        <RouterLink class="font-medium text-primary-soft hover:text-primary hover:underline" to="/masuk">Masuk</RouterLink>.
      </p>
    </div>
  </main>
</template>
