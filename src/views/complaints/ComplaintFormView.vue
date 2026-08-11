<script setup lang="ts">
import { reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import AppSidebar from '../../components/AppSidebar.vue';
import { getApiErrorMessage, getAuthHeaders } from '../../auth/auth';
import api from '../../lib/api';

const router = useRouter();
const form = reactive({ subject: '', category: 'PERORANGAN', description: '' });
const selectedFiles = ref<File[]>([]);
const uploadedFileCount = ref(0);
const createdComplaintId = ref<number | null>(null);
const attachmentError = ref('');
const errorMessage = ref('');
const submitting = ref(false);
const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];

function formatFileSize(size: number) { return size >= 1024 * 1024 ? `${(size / (1024 * 1024)).toFixed(1)} MB` : `${Math.ceil(size / 1024)} KB`; }
function handleFile(event: Event) {
  const input = event.target as HTMLInputElement;
  const files = Array.from(input.files ?? []);
  input.value = '';
  attachmentError.value = '';
  if (uploadedFileCount.value + selectedFiles.value.length + files.length > 3) { attachmentError.value = 'Maksimal 3 file untuk setiap keluhan.'; return; }
  const invalid = files.find((file) => !allowedTypes.includes(file.type));
  if (invalid) { attachmentError.value = `${invalid.name}: format harus PDF, JPEG, PNG, atau WebP.`; return; }
  const oversized = files.find((file) => file.size > 2 * 1024 * 1024);
  if (oversized) { attachmentError.value = `${oversized.name}: ukuran maksimal 2 MB.`; return; }
  selectedFiles.value.push(...files);
}
function removeFile(index: number) { selectedFiles.value.splice(index, 1); attachmentError.value = ''; }
async function uploadAttachment(complaintId: number, file: File) {
  const data = new FormData();
  data.append('file', file);
  await api.post(`/complaints/${complaintId}/attachments`, data, { headers: getAuthHeaders() });
}
async function submit() {
  if (attachmentError.value) return;
  submitting.value = true;
  errorMessage.value = '';
  let complaintId = createdComplaintId.value;
  try {
    if (complaintId === null) {
      const { data } = await api.post<{ complaint: { id: number } }>('/complaints', form, { headers: getAuthHeaders() });
      complaintId = data.complaint.id;
      createdComplaintId.value = complaintId;
    }
    while (selectedFiles.value.length) {
      await uploadAttachment(complaintId, selectedFiles.value[0]);
      selectedFiles.value.shift();
      uploadedFileCount.value += 1;
    }
    await router.push(`/keluhan/${complaintId}`);
  } catch (error) {
    const message = getApiErrorMessage(error);
    errorMessage.value = createdComplaintId.value ? `Keluhan sudah dibuat, tetapi lampiran gagal diunggah. ${message}` : message;
  } finally { submitting.value = false; }
}
</script>

<template>
  <div class="min-h-screen bg-background md:grid md:grid-cols-[auto_minmax(0,1fr)]">
    <AppSidebar />
    <main class="min-w-0 px-5 py-7 sm:px-7 md:px-8 md:py-9 lg:px-10">
      <header class="border-b border-border pb-6"><RouterLink class="text-sm font-semibold text-primary-soft hover:text-primary" to="/keluhan">← Kembali ke Keluhan Saya</RouterLink><h1 class="mt-4 text-2xl font-semibold text-primary">Buat Keluhan</h1><p class="mt-2 text-sm text-text-muted">Berikan informasi yang jelas agar keluhan dapat ditindaklanjuti dengan tepat.</p></header>
      <div class="mt-7 grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
        <form class="rounded-2xl border border-border bg-surface p-5 sm:p-6" @submit.prevent="submit">
          <div v-if="errorMessage" class="mb-5 rounded-lg bg-red-50 px-4 py-3 text-sm text-danger" role="alert">{{ errorMessage }}</div>
          <label><span class="form-label">Subjek</span><input v-model="form.subject" class="form-input" type="text" maxlength="191" placeholder="Ringkas pokok keluhan" required /></label>
          <label class="mt-5 block"><span class="form-label">Kategori</span><select v-model="form.category" class="form-input"><option value="PERORANGAN">Perorangan</option><option value="FASILITAS">Fasilitas</option><option value="LAINNYA">Lainnya</option></select></label>
          <label class="mt-5 block"><span class="form-label">Deskripsi</span><textarea v-model="form.description" class="form-input min-h-40 resize-y" placeholder="Jelaskan kejadian, dampak, dan informasi pendukung yang relevan" required></textarea></label>
          <div class="mt-5">
            <label class="form-label" for="complaint-attachment">Lampiran <span class="font-normal text-text-muted">(opsional)</span></label>
            <div class="flex flex-col gap-3 rounded-xl border border-dashed border-border-strong bg-surface-soft p-4 sm:flex-row sm:items-center sm:justify-between"><div><p class="text-sm font-medium text-text">Tambahkan dokumen pendukung</p><p class="mt-1 text-xs text-text-muted">Maksimal 3 file PDF, JPEG, PNG, atau WebP. Maksimal 2 MB per file.</p></div><label v-if="uploadedFileCount + selectedFiles.length < 3" class="secondary-button shrink-0 cursor-pointer" for="complaint-attachment">Pilih File</label><input id="complaint-attachment" class="sr-only" type="file" accept=".pdf,.jpg,.jpeg,.png,.webp" multiple @change="handleFile" /></div>
            <p v-if="attachmentError" class="mt-2 text-sm text-danger" role="alert">{{ attachmentError }}</p>
            <div v-if="selectedFiles.length" class="mt-3 divide-y divide-border rounded-xl border border-border"><div v-for="(file, index) in selectedFiles" :key="`${file.name}-${file.lastModified}`" class="flex items-center justify-between gap-3 px-4 py-3"><div class="min-w-0"><p class="truncate text-sm font-medium text-text">{{ file.name }}</p><p class="mt-1 text-xs text-text-muted">{{ formatFileSize(file.size) }}</p></div><button class="text-xs font-semibold text-danger" type="button" @click="removeFile(index)">Hapus</button></div></div>
          </div>
          <div class="mt-7 flex justify-end gap-3 border-t border-border pt-5"><RouterLink class="secondary-button" to="/keluhan">Batal</RouterLink><button class="primary-button" type="submit" :disabled="submitting">{{ submitting ? 'Mengirim...' : 'Kirim Keluhan' }}</button></div>
        </form>
        <aside class="h-fit rounded-2xl border border-border bg-surface p-5 sm:p-6"><h2 class="text-base font-semibold text-primary">Sebelum mengirim</h2><p class="mt-3 text-sm leading-6 text-text-muted">Pastikan deskripsi berisi informasi yang cukup dan tidak mencantumkan data pribadi yang tidak diperlukan.</p><p class="mt-4 rounded-xl bg-surface-soft p-4 text-sm leading-6 text-text-muted">Keluhan baru akan berstatus <strong class="text-primary">Terbuka</strong> dan ditinjau oleh HR Manager.</p></aside>
      </div>
    </main>
  </div>
</template>
