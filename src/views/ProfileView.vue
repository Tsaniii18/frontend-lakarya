<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import AppSidebar from '../components/AppSidebar.vue';
import ConfirmationModal from '../components/ConfirmationModal.vue';
import {
  clearAuth,
  getApiErrorMessage,
  getAuthHeaders,
  getProfilePictureBlob,
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
const fileInput = ref<HTMLInputElement | null>(null);
const selectedPicture = ref<File | null>(null);
const previewImageUrl = ref('');
const pictureModalOpen = ref(false);
const pictureUploading = ref(false);
const pictureError = ref('');
const profilePictureObjectUrl = ref('');
const editPictureModalOpen = ref(false);
const deletePictureModalOpen = ref(false);
const pictureDeleting = ref(false);

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

    if (data.profilePictureUrl) {
      try {
        await loadProfilePicture();
      } catch (error) {
        profileError.value = getApiErrorMessage(error);
      }
    }
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

  if (newPassword.value.length < 6) {
    passwordError.value = 'Password baru minimal 6 karakter.';
    return;
  }

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

function selectProfilePicture() {
  editPictureModalOpen.value = false;
  fileInput.value?.click();
}

async function loadProfilePicture() {
  revokeProfilePictureObjectUrl();
  const blob = await getProfilePictureBlob();
  profilePictureObjectUrl.value = URL.createObjectURL(blob);
}

function revokeProfilePictureObjectUrl() {
  if (!profilePictureObjectUrl.value) return;
  URL.revokeObjectURL(profilePictureObjectUrl.value);
  profilePictureObjectUrl.value = '';
}

function handlePictureSelection(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  profileError.value = '';
  profileSuccess.value = '';

  if (!file) return;

  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
    profileError.value = 'Format foto harus berupa JPEG, PNG, atau WebP.';
    input.value = '';
    return;
  }

  if (file.size > 2 * 1024 * 1024) {
    profileError.value = 'Ukuran foto maksimal 2 MB.';
    input.value = '';
    return;
  }

  selectedPicture.value = file;
  previewImageUrl.value = URL.createObjectURL(file);
  pictureError.value = '';
  pictureModalOpen.value = true;
}

function openCurrentPicture() {
  if (!profilePictureObjectUrl.value) return;

  selectedPicture.value = null;
  previewImageUrl.value = profilePictureObjectUrl.value;
  pictureError.value = '';
  pictureModalOpen.value = true;
}

function openEditPicture() {
  editPictureModalOpen.value = true;
}

function requestDeletePicture() {
  editPictureModalOpen.value = false;
  deletePictureModalOpen.value = true;
}

function closeDeletePictureModal() {
  if (pictureDeleting.value) return;
  deletePictureModalOpen.value = false;
}

function closePictureModal() {
  if (pictureUploading.value) return;

  if (selectedPicture.value && previewImageUrl.value) {
    URL.revokeObjectURL(previewImageUrl.value);
  }

  selectedPicture.value = null;
  previewImageUrl.value = '';
  pictureError.value = '';
  pictureModalOpen.value = false;

  if (fileInput.value) {
    fileInput.value.value = '';
  }
}

async function uploadProfilePicture() {
  const file = selectedPicture.value;
  if (!file) return;

  pictureUploading.value = true;
  pictureError.value = '';

  try {
    const formData = new FormData();
    formData.append('file', file);
    const { data } = await api.patch<UpdateProfileResponse>(
      '/users/profile/picture',
      formData,
      { headers: getAuthHeaders() },
    );
    profile.value = data.user;
    setAuthUser(data.user);
    await loadProfilePicture();
    profileSuccess.value = data.message;
    pictureUploading.value = false;
    closePictureModal();
  } catch (error) {
    pictureError.value = getApiErrorMessage(error);
  } finally {
    pictureUploading.value = false;
  }
}

async function deleteProfilePicture() {
  pictureDeleting.value = true;
  profileError.value = '';
  profileSuccess.value = '';

  try {
    const { data } = await api.delete<UpdateProfileResponse>(
      '/users/profile/picture',
      { headers: getAuthHeaders() },
    );
    profile.value = data.user;
    setAuthUser(data.user);
    revokeProfilePictureObjectUrl();
    profileSuccess.value = data.message;
  } catch (error) {
    profileError.value = getApiErrorMessage(error);
  } finally {
    pictureDeleting.value = false;
    deletePictureModalOpen.value = false;
  }
}

onMounted(loadProfile);
onBeforeUnmount(() => {
  closePictureModal();
  revokeProfilePictureObjectUrl();
});
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

      <p v-if="profileError" class="mt-5 rounded-lg bg-[#f7e8e7] px-4 py-3 text-sm text-danger" role="alert">
        {{ profileError }}
      </p>
      <div v-if="profileSuccess" class="mt-5 flex items-start justify-between gap-4 rounded-lg bg-[#e7f2ef] px-4 py-3 text-sm text-success" role="status">
        <p>{{ profileSuccess }}</p>
        <button class="shrink-0 text-lg leading-none" type="button" aria-label="Tutup pemberitahuan" @click="profileSuccess = ''">×</button>
      </div>

      <div v-if="!profileLoading" class="mt-7 grid items-start gap-5 xl:grid-cols-[minmax(0,1.1fr)_minmax(340px,0.9fr)]">
        <div class="space-y-5">
          <section class="rounded-2xl border border-border bg-surface p-5 sm:p-6">
            <div>
              <h2 class="text-lg font-semibold text-primary">Foto Profil</h2>
              <p class="mt-1 text-sm text-text-muted">Foto akan digunakan sebagai identitas akun Anda.</p>
            </div>

            <div v-if="profile" class="mt-6 flex flex-col gap-5 sm:flex-row sm:items-center">
              <button
                v-if="profile.profilePictureUrl && profilePictureObjectUrl"
                class="h-28 w-28 shrink-0 overflow-hidden rounded-full border-2 border-border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-soft focus-visible:ring-offset-2"
                type="button"
                aria-label="Preview foto profil"
                @click="openCurrentPicture"
              >
                <img class="h-full w-full object-cover" :src="profilePictureObjectUrl" :alt="`Foto profil ${profile.name}`" />
              </button>
              <button
                v-else
                class="inline-flex h-28 w-28 shrink-0 items-center justify-center rounded-full bg-primary text-3xl font-semibold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-soft focus-visible:ring-offset-2"
                type="button"
                aria-label="Pilih foto profil"
                @click="openEditPicture"
              >
                {{ profile.name.charAt(0).toUpperCase() }}
              </button>

              <div>
                <input
                  ref="fileInput"
                  class="hidden"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  @change="handlePictureSelection"
                />
                <button class="secondary-button" type="button" @click="openEditPicture">
                  Edit Foto
                </button>
                <p class="mt-3 text-xs leading-5 text-text-muted">JPEG, PNG, atau WebP. Maksimal 2 MB.</p>
              </div>
            </div>
          </section>

          <section class="rounded-2xl border border-border bg-surface p-5 sm:p-6">
            <div>
              <h2 class="text-lg font-semibold text-primary">Informasi Profil</h2>
              <p class="mt-1 text-sm text-text-muted">Nama dan email dapat diperbarui.</p>
            </div>

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
        </div>

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
              <input id="new-password" v-model="newPassword" class="form-input" type="password" autocomplete="new-password" required minlength="6" />
              <p class="mt-2 text-xs text-text-muted">Minimal 6 karakter.</p>
            </div>
            <div>
              <label class="form-label" for="repeat-new-password">Ulangi Password Baru</label>
              <input id="repeat-new-password" v-model="repeatNewPassword" class="form-input" type="password" autocomplete="new-password" required minlength="6" />
            </div>
            <button class="primary-button w-full" type="submit" :disabled="passwordSaving">
              {{ passwordSaving ? 'Menyimpan...' : 'Ganti Password' }}
            </button>
          </form>
        </section>
      </div>
    </main>

    <Teleport to="body">
      <div
        v-if="editPictureModalOpen"
        class="fixed inset-0 z-[100] flex items-center justify-center bg-primary/55 px-5 py-8"
        role="presentation"
        @click.self="editPictureModalOpen = false"
      >
        <section
          class="w-full max-w-xl rounded-2xl border border-border bg-surface p-5 shadow-[0_24px_70px_rgba(15,39,71,0.28)] sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-labelledby="edit-picture-title"
        >
          <div class="flex items-center justify-between gap-4">
            <div>
              <h2 id="edit-picture-title" class="text-lg font-semibold text-primary">Edit Foto Profil</h2>
              <p class="mt-1 text-sm text-text-muted">Pilih tindakan untuk foto profil Anda.</p>
            </div>
            <button
              class="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border text-xl leading-none text-text-muted hover:bg-surface-soft hover:text-primary"
              type="button"
              aria-label="Tutup edit foto"
              @click="editPictureModalOpen = false"
            >
              ×
            </button>
          </div>

          <div class="mt-5 flex max-h-[60vh] items-center justify-center overflow-hidden rounded-xl bg-surface-soft p-3">
            <img
              v-if="profilePictureObjectUrl"
              class="max-h-[55vh] max-w-full rounded-lg object-contain"
              :src="profilePictureObjectUrl"
              :alt="`Foto profil ${profile?.name}`"
            />
            <span v-else class="inline-flex h-40 w-40 items-center justify-center rounded-lg bg-primary text-4xl font-semibold text-white">
              {{ profile?.name?.charAt(0).toUpperCase() }}
            </span>
          </div>

          <div class="mt-6 grid gap-3" :class="profile?.profilePictureUrl ? 'sm:grid-cols-2' : ''">
            <button class="secondary-button border-success text-success hover:bg-[#e7f2ef]" type="button" @click="selectProfilePicture">
              Ganti Gambar
            </button>
            <button
              v-if="profile?.profilePictureUrl"
              class="secondary-button border-danger text-danger hover:bg-red-50"
              type="button"
              @click="requestDeletePicture"
            >
              Hapus Gambar
            </button>
          </div>
        </section>
      </div>
    </Teleport>

    <Teleport to="body">
      <div
        v-if="pictureModalOpen"
        class="fixed inset-0 z-[100] flex items-center justify-center bg-primary/55 px-5 py-8"
        role="presentation"
        @click.self="closePictureModal"
      >
        <section
          class="w-full max-w-xl rounded-2xl border border-border bg-surface p-5 shadow-[0_24px_70px_rgba(15,39,71,0.28)] sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-labelledby="picture-preview-title"
        >
          <div class="flex items-center justify-between gap-4">
            <div>
              <h2 id="picture-preview-title" class="text-lg font-semibold text-primary">
                {{ selectedPicture ? 'Preview Foto Baru' : 'Foto Profil' }}
              </h2>
              <p v-if="selectedPicture" class="mt-1 text-xs text-text-muted">{{ selectedPicture.name }}</p>
            </div>
            <button
              class="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border text-xl leading-none text-text-muted hover:bg-surface-soft hover:text-primary"
              type="button"
              aria-label="Tutup preview"
              :disabled="pictureUploading"
              @click="closePictureModal"
            >
              ×
            </button>
          </div>

          <p v-if="pictureError" class="mt-4 rounded-lg bg-[#f7e8e7] px-4 py-3 text-sm text-danger" role="alert">
            {{ pictureError }}
          </p>

          <div class="mt-5 flex max-h-[60vh] items-center justify-center overflow-hidden rounded-xl bg-surface-soft p-3">
            <img class="max-h-[55vh] max-w-full rounded-lg object-contain" :src="previewImageUrl" alt="Preview foto profil" />
          </div>

          <div class="mt-6 flex justify-end gap-3">
            <button class="secondary-button" type="button" :disabled="pictureUploading" @click="closePictureModal">
              {{ selectedPicture ? 'Batal' : 'Tutup' }}
            </button>
            <button
              v-if="selectedPicture"
              class="primary-button"
              type="button"
              :disabled="pictureUploading"
              @click="uploadProfilePicture"
            >
              {{ pictureUploading ? 'Mengunggah...' : 'Gunakan Foto' }}
            </button>
          </div>
        </section>
      </div>
    </Teleport>

    <ConfirmationModal
      :open="deletePictureModalOpen"
      title="Hapus foto profil?"
      message="Foto profil akan dihapus dari akun dan tidak dapat dikembalikan."
      confirm-label="Hapus Gambar"
      danger
      :loading="pictureDeleting"
      @close="closeDeletePictureModal"
      @confirm="deleteProfilePicture"
    />
  </div>
</template>
