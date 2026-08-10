<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import AppSidebar from '../../components/AppSidebar.vue';
import { getApiErrorMessage, getAuthHeaders } from '../../auth/auth';
import api from '../../lib/api';

interface LeaveBalance {
  year: number;
  totalDays: number;
  reservedDays: number;
  usedDays: number;
  availableDays: number;
}

const router = useRouter();
const form = reactive({
  leaveType: 'TAHUNAN' as 'TAHUNAN' | 'KHUSUS',
  startDate: '',
  endDate: '',
  reason: '',
});
const balance = ref<LeaveBalance | null>(null);
const loadingBalance = ref(false);
const submitting = ref(false);
const errorMessage = ref('');
const fieldError = ref('');

const selectedYear = computed(() => {
  if (/^\d{4}-\d{2}-\d{2}$/.test(form.startDate)) {
    return Number(form.startDate.slice(0, 4));
  }
  return new Date().getFullYear();
});

const today = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Asia/Jakarta',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
}).format(new Date());

const minimumStartDate = computed(() => {
  if (form.leaveType === 'KHUSUS') return today;

  const date = new Date(`${today}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + 3);
  return date.toISOString().slice(0, 10);
});

const totalDays = computed(() => {
  if (!form.startDate || !form.endDate) return 0;
  const start = new Date(`${form.startDate}T00:00:00.000Z`);
  const end = new Date(`${form.endDate}T00:00:00.000Z`);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end < start) return 0;
  return Math.floor((end.getTime() - start.getTime()) / 86400000) + 1;
});

const insufficientBalance = computed(
  () =>
    form.leaveType === 'TAHUNAN' &&
    totalDays.value > 0 &&
    balance.value !== null &&
    totalDays.value > balance.value.availableDays,
);

async function loadBalance() {
  if (form.leaveType !== 'TAHUNAN') return;
  loadingBalance.value = true;
  errorMessage.value = '';

  try {
    const { data } = await api.get<LeaveBalance>('/leave/balance', {
      headers: getAuthHeaders(),
      params: { year: selectedYear.value },
    });
    balance.value = data;
  } catch (error) {
    errorMessage.value = getApiErrorMessage(error);
  } finally {
    loadingBalance.value = false;
  }
}

function validateForm() {
  fieldError.value = '';
  if (!form.startDate || !form.endDate || !form.reason.trim()) {
    fieldError.value = 'Tanggal mulai, tanggal selesai, dan alasan wajib diisi.';
    return false;
  }
  if (form.startDate < minimumStartDate.value) {
    fieldError.value =
      form.leaveType === 'TAHUNAN'
        ? 'Cuti tahunan harus diajukan minimal 3 hari sebelum tanggal mulai.'
        : 'Cuti khusus tidak dapat diajukan untuk tanggal sebelum hari ini.';
    return false;
  }
  if (totalDays.value < 1) {
    fieldError.value = 'Tanggal selesai tidak boleh sebelum tanggal mulai.';
    return false;
  }
  if (insufficientBalance.value) {
    fieldError.value = `Saldo cuti tahunan tidak cukup. Tersedia ${balance.value?.availableDays ?? 0} hari.`;
    return false;
  }
  return true;
}

async function submit() {
  if (!validateForm()) return;
  submitting.value = true;
  errorMessage.value = '';

  try {
    const { data } = await api.post<{ request: { id: number } }>(
      '/leave',
      form,
      { headers: getAuthHeaders() },
    );
    await router.push(`/pengajuan/cuti/${data.request.id}`);
  } catch (error) {
    errorMessage.value = getApiErrorMessage(error);
  } finally {
    submitting.value = false;
  }
}

watch(
  () => form.leaveType,
  (value) => {
    fieldError.value = '';
    if (form.startDate && form.startDate < minimumStartDate.value) {
      form.startDate = '';
      form.endDate = '';
    }
    if (value === 'TAHUNAN') void loadBalance();
  },
);

watch(selectedYear, () => {
  if (form.leaveType === 'TAHUNAN') void loadBalance();
});

onMounted(loadBalance);
</script>

<template>
  <div class="min-h-screen bg-background md:grid md:grid-cols-[auto_minmax(0,1fr)]">
    <AppSidebar />

    <main class="min-w-0 px-5 py-7 sm:px-7 md:px-8 md:py-9 lg:px-10">
      <header class="border-b border-border pb-6">
        <RouterLink class="text-sm font-semibold text-primary-soft hover:text-primary" to="/pengajuan">← Kembali ke Pengajuan</RouterLink>
        <h1 class="mt-4 text-2xl font-semibold text-primary">Ajukan Cuti</h1>
        <p class="mt-2 text-sm text-text-muted">Isi periode dan alasan cuti yang Anda perlukan.</p>
      </header>

      <div class="mt-7 grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
        <form class="rounded-2xl border border-border bg-surface p-5 sm:p-6" @submit.prevent="submit">
          <div v-if="errorMessage" class="mb-5 rounded-lg bg-red-50 px-4 py-3 text-sm text-danger" role="alert">{{ errorMessage }}</div>

          <fieldset>
            <legend class="form-label">Tipe cuti</legend>
            <div class="grid gap-3 sm:grid-cols-2">
              <label class="flex cursor-pointer items-start gap-3 rounded-xl border border-border p-4" :class="{ 'border-primary-soft bg-[#f4f8fb]': form.leaveType === 'TAHUNAN' }">
                <input v-model="form.leaveType" class="mt-1" type="radio" value="TAHUNAN" />
                <span><span class="block text-sm font-semibold text-primary">Tahunan</span><span class="mt-1 block text-xs leading-5 text-text-muted">Menggunakan saldo cuti tahunan.</span></span>
              </label>
              <label class="flex cursor-pointer items-start gap-3 rounded-xl border border-border p-4" :class="{ 'border-primary-soft bg-[#f4f8fb]': form.leaveType === 'KHUSUS' }">
                <input v-model="form.leaveType" class="mt-1" type="radio" value="KHUSUS" />
                <span><span class="block text-sm font-semibold text-primary">Khusus</span><span class="mt-1 block text-xs leading-5 text-text-muted">Tidak menggunakan saldo tahunan.</span></span>
              </label>
            </div>
          </fieldset>

          <div class="mt-4 rounded-lg bg-[#e9f0f7] px-4 py-3 text-sm leading-6 text-primary-soft">
            <template v-if="form.leaveType === 'TAHUNAN'">
              Cuti tahunan harus diajukan minimal 3 hari sebelum tanggal mulai.
            </template>
            <template v-else>
              Cuti khusus dapat diajukan untuk hari ini, tetapi tidak dapat diajukan untuk tanggal yang sudah lewat.
            </template>
          </div>

          <div class="mt-5 grid gap-4 sm:grid-cols-2">
            <label>
              <span class="form-label">Tanggal mulai</span>
              <input v-model="form.startDate" class="form-input" type="date" :min="minimumStartDate" required />
            </label>
            <label>
              <span class="form-label">Tanggal selesai</span>
              <input v-model="form.endDate" class="form-input" type="date" :min="form.startDate || minimumStartDate" required />
            </label>
          </div>

          <label class="mt-5 block">
            <span class="form-label">Alasan</span>
            <textarea v-model="form.reason" class="form-input min-h-32 resize-y" placeholder="Jelaskan keperluan cuti Anda" required></textarea>
          </label>

          <p v-if="totalDays > 0" class="mt-3 text-sm text-text-muted">Durasi pengajuan: <span class="font-semibold text-primary">{{ totalDays }} hari</span></p>
          <p v-if="fieldError" class="mt-4 text-sm text-danger" role="alert">{{ fieldError }}</p>
          <p v-if="insufficientBalance" class="mt-3 rounded-lg bg-red-50 px-4 py-3 text-sm text-danger" role="alert">
            Saldo tidak cukup untuk {{ totalDays }} hari. Saldo tersedia {{ balance?.availableDays }} hari.
          </p>

          <div class="mt-7 flex flex-wrap justify-end gap-3 border-t border-border pt-5">
            <RouterLink class="secondary-button" to="/pengajuan">Batal</RouterLink>
            <button class="primary-button" type="submit" :disabled="submitting || insufficientBalance">
              {{ submitting ? 'Mengajukan...' : 'Ajukan Cuti' }}
            </button>
          </div>
        </form>

        <aside v-if="form.leaveType === 'TAHUNAN'" class="h-fit rounded-2xl border border-border bg-surface p-5 sm:p-6">
          <p class="text-sm font-medium text-text-muted">Cuti Tahunan {{ selectedYear }}</p>
          <p v-if="loadingBalance" class="mt-5 text-sm text-text-muted">Memuat saldo...</p>
          <template v-else-if="balance">
            <p class="mt-4 text-4xl font-semibold tracking-tight text-primary">{{ balance.availableDays }} <span class="text-base font-medium text-text-muted">hari</span></p>
            <p class="mt-1 text-sm text-text-muted">Tersedia</p>
            <div class="mt-6 grid grid-cols-3 gap-2 border-t border-border pt-4 text-center">
              <div><p class="font-semibold text-primary">{{ balance.totalDays }}</p><p class="mt-1 text-xs text-text-muted">Total</p></div>
              <div><p class="font-semibold text-primary">{{ balance.usedDays }}</p><p class="mt-1 text-xs text-text-muted">Terpakai</p></div>
              <div><p class="font-semibold text-primary">{{ balance.reservedDays }}</p><p class="mt-1 text-xs text-text-muted">Dipesan</p></div>
            </div>
          </template>
        </aside>
      </div>
    </main>
  </div>
</template>
