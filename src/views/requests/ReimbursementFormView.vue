<script setup lang="ts">
import { computed, reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import AppSidebar from '../../components/AppSidebar.vue';
import { getApiErrorMessage, getAuthHeaders } from '../../auth/auth';
import api from '../../lib/api';

const router = useRouter();
type ExpenseType = 'TRANSPORTASI' | 'KONSUMSI' | 'OPERASIONAL' | 'LAINNYA';
const form = reactive({
  expenseType: 'TRANSPORTASI' as ExpenseType,
  expenseDate: '',
  expenseAmount: '',
  description: '',
});
const selectedFiles = ref<File[]>([]);
const attachmentError = ref('');
const errorMessage = ref('');
const fieldError = ref('');
const submitting = ref(false);
const createdRequestId = ref<number | null>(null);
const uploadedFileCount = ref(0);
const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];

const amount = computed(() => Number(form.expenseAmount));
function formatCurrency(value: number) {
  if (!Number.isFinite(value) || value <= 0) return 'Rp0';
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 2,
  }).format(value);
}

function expenseLabel(value: ExpenseType) {
  return {
    TRANSPORTASI: 'Transportasi',
    KONSUMSI: 'Konsumsi',
    OPERASIONAL: 'Operasional',
    LAINNYA: 'Lainnya',
  }[value];
}

function formatFileSize(size: number) {
  return size >= 1024 * 1024
    ? `${(size / (1024 * 1024)).toFixed(1)} MB`
    : `${Math.ceil(size / 1024)} KB`;
}

function handleFile(event: Event) {
  const input = event.target as HTMLInputElement;
  const files = Array.from(input.files ?? []);
  input.value = '';
  attachmentError.value = '';
  if (!files.length) return;
  if (uploadedFileCount.value + selectedFiles.value.length + files.length > 3) {
    attachmentError.value = 'Maksimal 3 file untuk setiap pengajuan.';
    return;
  }
  const invalid = files.find((file) => !allowedTypes.includes(file.type));
  if (invalid) {
    attachmentError.value = `${invalid.name}: format harus PDF, JPEG, PNG, atau WebP.`;
    return;
  }
  const oversized = files.find((file) => file.size > 2 * 1024 * 1024);
  if (oversized) {
    attachmentError.value = `${oversized.name}: ukuran maksimal 2 MB.`;
    return;
  }
  selectedFiles.value.push(...files);
}

function removeFile(index: number) {
  selectedFiles.value.splice(index, 1);
  attachmentError.value = '';
}

function validateForm() {
  fieldError.value = '';
  if (!form.expenseDate || !form.description.trim() || !form.expenseAmount) {
    fieldError.value = 'Tanggal, nominal, dan deskripsi biaya wajib diisi.';
    return false;
  }
  if (!Number.isFinite(amount.value) || amount.value <= 0) {
    fieldError.value = 'Nominal harus lebih dari 0.';
    return false;
  }
  if (Math.abs(amount.value * 100 - Math.round(amount.value * 100)) > 1e-8) {
    fieldError.value = 'Nominal maksimal memiliki 2 angka desimal.';
    return false;
  }
  return true;
}

async function uploadAttachment(requestId: number, file: File) {
  const data = new FormData();
  data.append('file', file);
  await api.post(`/requests/${requestId}/attachments`, data, {
    headers: getAuthHeaders(),
  });
}

async function submit() {
  if (!validateForm() || attachmentError.value) return;
  submitting.value = true;
  errorMessage.value = '';
  let requestId = createdRequestId.value;

  try {
    if (requestId === null) {
      const { data } = await api.post<{ request: { id: number } }>(
        '/reimbursements',
        {
          ...form,
          expenseAmount: amount.value,
        },
        { headers: getAuthHeaders() },
      );
      requestId = data.request.id;
      createdRequestId.value = requestId;
    }

    while (selectedFiles.value.length) {
      await uploadAttachment(requestId, selectedFiles.value[0]);
      selectedFiles.value.shift();
      uploadedFileCount.value += 1;
    }
    await router.push(`/pengajuan/reimbursement/${requestId}`);
  } catch (error) {
    const message = getApiErrorMessage(error);
    errorMessage.value = createdRequestId.value
      ? `Pengajuan sudah dibuat, tetapi bukti gagal diunggah. ${message}`
      : message;
  } finally {
    submitting.value = false;
  }
}
</script>

<template>
  <div class="min-h-screen bg-background md:grid md:grid-cols-[auto_minmax(0,1fr)]">
    <AppSidebar />
    <main class="min-w-0 px-5 py-7 sm:px-7 md:px-8 md:py-9 lg:px-10">
      <header class="border-b border-border pb-6">
        <RouterLink class="text-sm font-semibold text-primary-soft hover:text-primary" to="/pengajuan">← Kembali ke Pengajuan</RouterLink>
        <h1 class="mt-4 text-2xl font-semibold text-primary">Penggantian Biaya</h1>
        <p class="mt-2 text-sm text-text-muted">Lengkapi rincian biaya dan unggah bukti pendukung.</p>
      </header>

      <div class="mt-7 grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
        <form class="rounded-2xl border border-border bg-surface p-5 sm:p-6" @submit.prevent="submit">
          <div v-if="errorMessage" class="mb-5 rounded-lg bg-red-50 px-4 py-3 text-sm text-danger" role="alert">{{ errorMessage }}</div>

          <div class="grid gap-4 sm:grid-cols-2">
            <label><span class="form-label">Tipe biaya</span><select v-model="form.expenseType" class="form-input"><option value="TRANSPORTASI">Transportasi</option><option value="KONSUMSI">Konsumsi</option><option value="OPERASIONAL">Operasional</option><option value="LAINNYA">Lainnya</option></select></label>
            <label><span class="form-label">Tanggal biaya</span><input v-model="form.expenseDate" class="form-input" type="date" required /></label>
          </div>

          <label class="mt-5 block"><span class="form-label">Nominal</span><input v-model="form.expenseAmount" class="form-input" type="number" min="0.01" max="999999999999.99" step="0.01" placeholder="Contoh: 150000" required /></label>
          <label class="mt-5 block"><span class="form-label">Deskripsi</span><textarea v-model="form.description" class="form-input min-h-32 resize-y" placeholder="Jelaskan kebutuhan dan rincian biaya" required></textarea></label>

          <div class="mt-5">
            <label class="form-label" for="reimbursement-proof">Bukti biaya <span class="font-normal text-text-muted">(opsional)</span></label>
            <div class="flex flex-col gap-3 rounded-xl border border-dashed border-border-strong bg-surface-soft p-4 sm:flex-row sm:items-center sm:justify-between">
              <div><p class="text-sm font-medium text-text">Unggah nota atau bukti pembayaran</p><p class="mt-1 text-xs text-text-muted">Maksimal 3 file PDF, JPEG, PNG, atau WebP. Maksimal 2 MB per file.</p></div>
              <label v-if="uploadedFileCount + selectedFiles.length < 3" class="secondary-button shrink-0 cursor-pointer" for="reimbursement-proof">Pilih File</label>
              <input id="reimbursement-proof" class="sr-only" type="file" accept=".pdf,.jpg,.jpeg,.png,.webp" multiple @change="handleFile" />
            </div>
            <p v-if="attachmentError" class="mt-2 text-sm text-danger" role="alert">{{ attachmentError }}</p>
            <div v-if="selectedFiles.length" class="mt-3 divide-y divide-border rounded-xl border border-border">
              <div v-for="(file, index) in selectedFiles" :key="`${file.name}-${file.lastModified}`" class="flex items-center justify-between gap-3 px-4 py-3"><div class="min-w-0"><p class="truncate text-sm font-medium text-text">{{ file.name }}</p><p class="mt-1 text-xs text-text-muted">{{ formatFileSize(file.size) }}</p></div><button class="text-xs font-semibold text-danger" type="button" @click="removeFile(index)">Hapus</button></div>
            </div>
          </div>

          <p v-if="fieldError" class="mt-4 text-sm text-danger" role="alert">{{ fieldError }}</p>
          <div class="mt-7 flex justify-end gap-3 border-t border-border pt-5"><RouterLink class="secondary-button" to="/pengajuan">Batal</RouterLink><button class="primary-button" type="submit" :disabled="submitting">{{ submitting ? 'Mengajukan...' : 'Ajukan Penggantian Biaya' }}</button></div>
        </form>

        <aside class="h-fit rounded-2xl border border-border bg-surface p-5 sm:p-6">
          <h2 class="text-base font-semibold text-primary">Ringkasan</h2>
          <dl class="mt-5 space-y-4"><div class="flex justify-between gap-4"><dt class="text-sm text-text-muted">Tipe</dt><dd class="text-right text-sm font-medium text-text">{{ expenseLabel(form.expenseType) }}</dd></div><div class="flex justify-between gap-4 border-t border-border pt-4"><dt class="text-sm text-text-muted">Nominal</dt><dd class="text-right text-sm font-semibold text-primary">{{ formatCurrency(amount) }}</dd></div><div class="flex justify-between gap-4 border-t border-border pt-4"><dt class="text-sm text-text-muted">Bukti</dt><dd class="text-right text-sm font-medium text-text">{{ selectedFiles.length + uploadedFileCount }} file</dd></div></dl>
        </aside>
      </div>
    </main>
  </div>
</template>
