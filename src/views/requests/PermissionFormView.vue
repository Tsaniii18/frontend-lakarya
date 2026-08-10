<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import AppSidebar from '../../components/AppSidebar.vue';
import { getApiErrorMessage, getAuthHeaders } from '../../auth/auth';
import api from '../../lib/api';

const router = useRouter();
const form = reactive({
  permissionType: 'HARIAN' as 'HARIAN' | 'JAM',
  startDate: '',
  endDate: '',
  date: '',
  startTime: '',
  endTime: '',
  reason: '',
});
const submitting = ref(false);
const errorMessage = ref('');
const fieldError = ref('');
const today = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Asia/Jakarta',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
}).format(new Date());

const totalDays = computed(() => {
  if (!form.startDate || !form.endDate) return 0;
  const start = new Date(`${form.startDate}T00:00:00.000Z`);
  const end = new Date(`${form.endDate}T00:00:00.000Z`);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end < start) return 0;
  return Math.floor((end.getTime() - start.getTime()) / 86400000) + 1;
});

const timeDuration = computed(() => {
  if (!form.startTime || !form.endTime || form.endTime <= form.startTime) return '';
  const [startHour, startMinute] = form.startTime.split(':').map(Number);
  const [endHour, endMinute] = form.endTime.split(':').map(Number);
  const totalMinutes = endHour * 60 + endMinute - startHour * 60 - startMinute;
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return [hours ? `${hours} jam` : '', minutes ? `${minutes} menit` : ''].filter(Boolean).join(' ');
});

function formatSelectedDate(value: string) {
  if (!value) return 'Belum dipilih';
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(`${value}T00:00:00.000Z`));
}

function validateForm() {
  fieldError.value = '';

  if (!form.reason.trim()) {
    fieldError.value = 'Alasan izin wajib diisi.';
    return false;
  }

  if (form.permissionType === 'HARIAN') {
    if (!form.startDate || !form.endDate) {
      fieldError.value = 'Tanggal mulai dan tanggal selesai wajib diisi.';
      return false;
    }
    if (form.startDate < today) {
      fieldError.value = 'Pengajuan izin tidak dapat menggunakan tanggal sebelum hari ini.';
      return false;
    }
    if (totalDays.value < 1) {
      fieldError.value = 'Tanggal selesai tidak boleh sebelum tanggal mulai.';
      return false;
    }
    return true;
  }

  if (!form.date || !form.startTime || !form.endTime) {
    fieldError.value = 'Tanggal, waktu mulai, dan waktu selesai wajib diisi.';
    return false;
  }
  if (form.date < today) {
    fieldError.value = 'Pengajuan izin tidak dapat menggunakan tanggal sebelum hari ini.';
    return false;
  }
  if (!timeDuration.value) {
    fieldError.value = 'Waktu selesai harus setelah waktu mulai.';
    return false;
  }
  return true;
}

async function submit() {
  if (!validateForm()) return;
  submitting.value = true;
  errorMessage.value = '';

  const isDaily = form.permissionType === 'HARIAN';
  const payload = {
    permissionType: form.permissionType,
    startDate: isDaily ? form.startDate : form.date,
    endDate: isDaily ? form.endDate : form.date,
    startTime: isDaily ? undefined : form.startTime,
    endTime: isDaily ? undefined : form.endTime,
    reason: form.reason,
  };

  try {
    const { data } = await api.post<{ request: { id: number } }>(
      '/permission',
      payload,
      { headers: getAuthHeaders() },
    );
    await router.push(`/pengajuan/izin/${data.request.id}`);
  } catch (error) {
    errorMessage.value = getApiErrorMessage(error);
  } finally {
    submitting.value = false;
  }
}

watch(
  () => form.permissionType,
  () => {
    fieldError.value = '';
  },
);
</script>

<template>
  <div class="min-h-screen bg-background md:grid md:grid-cols-[auto_minmax(0,1fr)]">
    <AppSidebar />

    <main class="min-w-0 px-5 py-7 sm:px-7 md:px-8 md:py-9 lg:px-10">
      <header class="border-b border-border pb-6">
        <RouterLink class="text-sm font-semibold text-primary-soft hover:text-primary" to="/pengajuan">← Kembali ke Pengajuan</RouterLink>
        <h1 class="mt-4 text-2xl font-semibold text-primary">Ajukan Izin</h1>
        <p class="mt-2 text-sm text-text-muted">Pilih izin harian atau per jam sesuai kebutuhan Anda.</p>
      </header>

      <div class="mt-7 grid gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
        <form class="rounded-2xl border border-border bg-surface p-5 sm:p-6" @submit.prevent="submit">
          <div class="flex items-center gap-3 border-b border-border pb-5">
            <span class="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#e7f2ef] text-success">
              <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
                <circle cx="12" cy="12" r="8.5" />
                <path d="M12 7.5V12l3 2" />
              </svg>
            </span>
            <div>
              <h2 class="text-lg font-semibold text-primary">Informasi Izin</h2>
              <p class="mt-1 text-sm text-text-muted">Lengkapi tipe, waktu, dan alasan izin.</p>
            </div>
          </div>

          <div v-if="errorMessage" class="mt-5 rounded-lg bg-red-50 px-4 py-3 text-sm text-danger" role="alert">{{ errorMessage }}</div>

        <fieldset class="mt-5">
          <legend class="form-label">Tipe izin</legend>
          <div class="grid gap-3 sm:grid-cols-2">
            <label class="flex cursor-pointer items-start gap-3 rounded-xl border border-border p-4" :class="{ 'border-primary-soft bg-[#f4f8fb]': form.permissionType === 'HARIAN' }">
              <input v-model="form.permissionType" class="mt-1" type="radio" value="HARIAN" />
              <span><span class="block text-sm font-semibold text-primary">Harian</span><span class="mt-1 block text-xs leading-5 text-text-muted">Untuk izin selama satu atau beberapa hari.</span></span>
            </label>
            <label class="flex cursor-pointer items-start gap-3 rounded-xl border border-border p-4" :class="{ 'border-primary-soft bg-[#f4f8fb]': form.permissionType === 'JAM' }">
              <input v-model="form.permissionType" class="mt-1" type="radio" value="JAM" />
              <span><span class="block text-sm font-semibold text-primary">Per Jam</span><span class="mt-1 block text-xs leading-5 text-text-muted">Untuk izin pada rentang waktu di satu hari.</span></span>
            </label>
          </div>
        </fieldset>

        <div v-if="form.permissionType === 'HARIAN'" class="mt-5 grid gap-4 sm:grid-cols-2">
          <label>
            <span class="form-label">Tanggal mulai</span>
            <input v-model="form.startDate" class="form-input" type="date" :min="today" required />
          </label>
          <label>
            <span class="form-label">Tanggal selesai</span>
            <input v-model="form.endDate" class="form-input" type="date" :min="form.startDate || today" required />
          </label>
        </div>

        <div v-else class="mt-5 grid gap-4 sm:grid-cols-3">
          <label>
            <span class="form-label">Tanggal</span>
            <input v-model="form.date" class="form-input" type="date" :min="today" required />
          </label>
          <label>
            <span class="form-label">Waktu mulai</span>
            <input v-model="form.startTime" class="form-input" type="time" required />
          </label>
          <label>
            <span class="form-label">Waktu selesai</span>
            <input v-model="form.endTime" class="form-input" type="time" :min="form.startTime || undefined" required />
          </label>
        </div>

        <p v-if="form.permissionType === 'HARIAN' && totalDays > 0" class="mt-3 text-sm text-text-muted">Durasi izin: <span class="font-semibold text-primary">{{ totalDays }} hari</span></p>
        <p v-if="form.permissionType === 'JAM' && timeDuration" class="mt-3 text-sm text-text-muted">Durasi izin: <span class="font-semibold text-primary">{{ timeDuration }}</span></p>

        <label class="mt-5 block">
          <span class="form-label">Alasan</span>
          <textarea v-model="form.reason" class="form-input min-h-32 resize-y" placeholder="Jelaskan keperluan izin Anda" required></textarea>
        </label>

        <p v-if="fieldError" class="mt-4 text-sm text-danger" role="alert">{{ fieldError }}</p>

          <div class="mt-7 flex flex-wrap justify-end gap-3 border-t border-border pt-5">
            <RouterLink class="secondary-button" to="/pengajuan">Batal</RouterLink>
            <button class="primary-button" type="submit" :disabled="submitting">{{ submitting ? 'Mengajukan...' : 'Ajukan Izin' }}</button>
          </div>
        </form>

        <aside class="space-y-5">
          <section class="rounded-2xl border border-border bg-surface p-5 sm:p-6">
            <h2 class="text-base font-semibold text-primary">Ringkasan Izin</h2>
            <dl class="mt-5 space-y-4">
              <div class="flex items-start justify-between gap-4">
                <dt class="text-sm text-text-muted">Tipe</dt>
                <dd class="text-right text-sm font-medium text-text">{{ form.permissionType === 'HARIAN' ? 'Harian' : 'Per Jam' }}</dd>
              </div>
              <div class="flex items-start justify-between gap-4 border-t border-border pt-4">
                <dt class="text-sm text-text-muted">Tanggal</dt>
                <dd v-if="form.permissionType === 'HARIAN'" class="max-w-40 text-right text-sm font-medium leading-5 text-text">
                  {{ formatSelectedDate(form.startDate) }}<template v-if="form.endDate"> – {{ formatSelectedDate(form.endDate) }}</template>
                </dd>
                <dd v-else class="text-right text-sm font-medium text-text">{{ formatSelectedDate(form.date) }}</dd>
              </div>
              <div class="flex items-start justify-between gap-4 border-t border-border pt-4">
                <dt class="text-sm text-text-muted">Durasi</dt>
                <dd class="text-right text-sm font-medium text-text">
                  <template v-if="form.permissionType === 'HARIAN'">{{ totalDays > 0 ? `${totalDays} hari` : 'Belum dihitung' }}</template>
                  <template v-else>{{ timeDuration || 'Belum dihitung' }}</template>
                </dd>
              </div>
              <div v-if="form.permissionType === 'JAM'" class="flex items-start justify-between gap-4 border-t border-border pt-4">
                <dt class="text-sm text-text-muted">Waktu</dt>
                <dd class="text-right text-sm font-medium text-text">{{ form.startTime || '—' }} – {{ form.endTime || '—' }}</dd>
              </div>
            </dl>
          </section>

          <section class="rounded-2xl border border-[#cfe2dc] bg-[#f1f8f6] p-5">
            <div class="flex items-start gap-3">
              <span class="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#dcefeb] text-success">
                <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M12 8h.01M11 12h1v4h1" /><circle cx="12" cy="12" r="9" /></svg>
              </span>
              <div><h2 class="text-sm font-semibold text-primary">Tidak memakai saldo cuti</h2><p class="mt-1 text-xs leading-5 text-text-muted">Pengajuan izin harian maupun per jam tidak mengurangi saldo cuti tahunan Anda.</p></div>
            </div>
          </section>
        </aside>
      </div>
    </main>
  </div>
</template>
