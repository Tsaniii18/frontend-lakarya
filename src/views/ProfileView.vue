<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import AppSidebar from '../components/AppSidebar.vue';
import {
  clearAuth,
  getApiErrorMessage,
  getAuthHeaders,
  setAuthUser,
} from '../auth/auth';
import type { AuthUser } from '../auth/auth';
import api from '../lib/api';

interface ProfileUser extends AuthUser {
  createdAt: string;
  updatedAt: string;
}

interface UpdateProfileResponse {
  message: string;
  user: ProfileUser;
}

const router = useRouter();
const profile = ref<ProfileUser | null>(null);
const name = ref('');
const email = ref('');
const currentPassword = ref('');
const newPassword = ref('');
const repeatNewPassword = ref('');
const profileLoading = ref(true);
const profileSaving = ref(false);
const passwordSaving = ref(false);
const profileError = ref('');
const profileSuccess = ref('');
const passwordError = ref('');

function roleLabel(role: AuthUser['role']) {
  return role === 'MANAJER' ? 'Manajer' : 'Staf';
}

function statusLabel(status: string) {
  if (status === 'MENUNGGU') return 'Menunggu';
  if (status === 'AKTIF') return 'Aktif';
  if (status === 'DITANGGUHKAN') return 'Ditangguhkan';
  if (status === 'DITOLAK') return 'Ditolak';
  return status;
}

async function loadProfile() {
  profileLoading.value = true;
  profileError.value = '';

  try {
    const { data } = await api.get<ProfileUser>('/users/profile', {
      headers: getAuthHeaders(),
    });
    profile.value = data;
    name.value = data.name;
    email.value = data.email;
  } catch (error) {
    profileError.value = getApiErrorMessage(error);
  } finally {
    profileLoading.value = false;
  }
}

async function saveProfile() {
  profileSaving.value = true;
  profileError.value = '';
  profileSuccess.value = '';

  try {
    const { data } = await api.patch<UpdateProfileResponse>(
      '/users/profile',
      {
        name: name.value,
        email: email.value,
      },
      { headers: getAuthHeaders() },
    );
    profile.value = data.user;
    setAuthUser(data.user);
    profileSuccess.value = data.message;
  } catch (error) {
    profileError.value = getApiErrorMessage(error);
  } finally {
    profileSaving.value = false;
  }
}

async function changePassword() {
  passwordError.value = '';

  if (newPassword.value !== repeatNewPassword.value) {
    passwordError.value = 'Ulangi password baru tidak sama.';
    return;
  }

  passwordSaving.value = true;

  try {
    await api.patch(
      '/users/profile/password',
      {
        currentPassword: currentPassword.value,
        newPassword: newPassword.value,
        repeatNewPassword: repeatNewPassword.value,
      },
      { headers: getAuthHeaders() },
    );
    clearAuth();
    await router.push({ name: 'login', query: { passwordChanged: '1' } });
  } catch (error) {
    passwordError.value = getApiErrorMessage(error);
  } finally {
    passwordSaving.value = false;
  }
}

onMounted(loadProfile);
</script>

<template>
  <div class="min-h-screen bg-background md:grid md:grid-cols-[auto_minmax(0,1fr)]">
    <AppSidebar />

    <main class="min-w-0 px-5 py-7 sm:px-7 md:px-8 md:py-9 lg:px-10">
      <header class="border-b border-border pb-6">
        <p class="text-sm font-medium text-primary-soft">Akun Karyawan</p>
        <h1 class="mt-1 text-2xl font-semibold text-primary">Profil Saya</h1>
        <p class="mt-2 text-sm text-text-muted">Lihat dan perbarui informasi akun Anda.</p>
      </header>

      <p v-if="profileLoading" class="mt-7 text-sm text-text-muted">Memuat profil...</p>

      <div v-else class="mt-7 grid items-start gap-5 xl:grid-cols-[minmax(0,1.1fr)_minmax(340px,0.9fr)]">
        <section class="rounded-2xl border border-border bg-surface p-5 sm:p-6">
          <div>
            <h2 class="text-lg font-semibold text-primary">Informasi Profil</h2>
            <p class="mt-1 text-sm text-text-muted">Nama dan email dapat diperbarui.</p>
          </div>

          <p v-if="profileError" class="mt-5 rounded-lg bg-[#f7e8e7] px-4 py-3 text-sm text-danger" role="alert">
            {{ profileError }}
          </p>
          <p v-if="profileSuccess" class="mt-5 rounded-lg bg-[#e7f2ef] px-4 py-3 text-sm text-success" role="status">
            {{ profileSuccess }}
          </p>

          <form v-if="profile" class="mt-6 grid gap-5 sm:grid-cols-2" @submit.prevent="saveProfile">
            <div>
              <label class="form-label" for="employee-number">Nomor Pegawai</label>
              <input id="employee-number" class="form-input bg-surface-soft" type="text" :value="profile.employeeNumber" readonly />
            </div>
            <div>
              <label class="form-label" for="department">Departemen</label>
              <input id="department" class="form-input bg-surface-soft" type="text" :value="profile.department.name" readonly />
            </div>
            <div class="sm:col-span-2">
              <label class="form-label" for="profile-name">Nama Lengkap</label>
              <input id="profile-name" v-model="name" class="form-input" type="text" autocomplete="name" required />
            </div>
            <div class="sm:col-span-2">
              <label class="form-label" for="profile-email">Email</label>
              <input id="profile-email" v-model="email" class="form-input" type="email" autocomplete="email" required />
            </div>
            <div>
              <label class="form-label" for="role">Peran</label>
              <input id="role" class="form-input bg-surface-soft" type="text" :value="roleLabel(profile.role)" readonly />
            </div>
            <div>
              <label class="form-label" for="account-status">Status Akun</label>
              <input id="account-status" class="form-input bg-surface-soft" type="text" :value="statusLabel(profile.accountStatus)" readonly />
            </div>
            <div class="sm:col-span-2 flex justify-end">
              <button class="primary-button" type="submit" :disabled="profileSaving">
                {{ profileSaving ? 'Menyimpan...' : 'Simpan Perubahan' }}
              </button>
            </div>
          </form>
        </section>

        <section class="rounded-2xl border border-border bg-surface p-5 sm:p-6">
          <div>
            <h2 class="text-lg font-semibold text-primary">Ganti Password</h2>
            <p class="mt-1 text-sm leading-6 text-text-muted">Setelah password berhasil diganti, Anda harus masuk kembali.</p>
          </div>

          <p v-if="passwordError" class="mt-5 rounded-lg bg-[#f7e8e7] px-4 py-3 text-sm text-danger" role="alert">
            {{ passwordError }}
          </p>

          <form class="mt-6 space-y-5" @submit.prevent="changePassword">
            <div>
              <label class="form-label" for="current-password">Password Saat Ini</label>
              <input id="current-password" v-model="currentPassword" class="form-input" type="password" autocomplete="current-password" required />
            </div>
            <div>
              <label class="form-label" for="new-password">Password Baru</label>
              <input id="new-password" v-model="newPassword" class="form-input" type="password" autocomplete="new-password" required />
            </div>
            <div>
              <label class="form-label" for="repeat-new-password">Ulangi Password Baru</label>
              <input id="repeat-new-password" v-model="repeatNewPassword" class="form-input" type="password" autocomplete="new-password" required />
            </div>
            <button class="primary-button w-full" type="submit" :disabled="passwordSaving">
              {{ passwordSaving ? 'Menyimpan...' : 'Ganti Password' }}
            </button>
          </form>
        </section>
      </div>
    </main>
  </div>
</template>
