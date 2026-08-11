<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';
import AppSidebar from '../../components/AppSidebar.vue';
import { getApiErrorMessage, getAuthHeaders } from '../../auth/auth';
import api from '../../lib/api';

type ComplaintStatus = 'TERBUKA' | 'DIPROSES' | 'SELESAI' | 'DITUTUP';
type ComplaintCategory = 'PERORANGAN' | 'FASILITAS' | 'LAINNYA';
interface ManagedComplaint {
  id: number; subject: string; category: ComplaintCategory; description: string; status: ComplaintStatus;
  resolutionNote: string | null; createdAt: string; reviewedAt: string | null;
  reporter: { name: string; employeeNumber: string; department: { name: string } };
  handler: { name: string } | null;
  attachments: Array<{ id: number; fileName: string; sizeByte: number }>;
}

const route = useRoute();
const complaint = ref<ManagedComplaint | null>(null);
const resolutionNote = ref('');
const loading = ref(false);
const processing = ref(false);
const errorMessage = ref('');
const successMessage = ref('');
const nextActions = computed(() => {
  if (complaint.value?.status === 'TERBUKA') return [{ status: 'DIPROSES' as const, label: 'Mulai Tangani' }];
  if (complaint.value?.status === 'DIPROSES') return [{ status: 'SELESAI' as const, label: 'Tandai Selesai' }];
  if (complaint.value?.status === 'SELESAI') return [{ status: 'DIPROSES' as const, label: 'Proses Kembali' }, { status: 'DITUTUP' as const, label: 'Tutup Keluhan' }];
  return [];
});

function categoryLabel(value: ComplaintCategory) { return { PERORANGAN: 'Perorangan', FASILITAS: 'Fasilitas', LAINNYA: 'Lainnya' }[value]; }
function statusLabel(value: ComplaintStatus) { return { TERBUKA: 'Terbuka', DIPROSES: 'Diproses', SELESAI: 'Selesai', DITUTUP: 'Ditutup' }[value]; }
function statusClass(value: ComplaintStatus) { return value === 'TERBUKA' ? 'status-warning' : value === 'SELESAI' ? 'status-success' : 'status-info'; }
function formatDate(value: string) { return new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(value)); }
function formatFileSize(size: number) { return size >= 1024 * 1024 ? `${(size / (1024 * 1024)).toFixed(1)} MB` : `${Math.ceil(size / 1024)} KB`; }

async function loadDetail() {
  loading.value = true;
  errorMessage.value = '';
  try {
    const { data } = await api.get<ManagedComplaint>(`/manage/complaints/${route.params.id}`, { headers: getAuthHeaders() });
    complaint.value = data;
    resolutionNote.value = data.resolutionNote ?? '';
  } catch (error) { errorMessage.value = getApiErrorMessage(error); }
  finally { loading.value = false; }
}
async function updateComplaint(status?: ComplaintStatus) {
  if (!complaint.value) return;
  processing.value = true;
  errorMessage.value = '';
  successMessage.value = '';
  try {
    const { data } = await api.patch<{ message: string; complaint: ManagedComplaint }>(`/manage/complaints/${complaint.value.id}`, { ...(status ? { status } : {}), resolutionNote: resolutionNote.value }, { headers: getAuthHeaders() });
    complaint.value = data.complaint;
    resolutionNote.value = data.complaint.resolutionNote ?? '';
    successMessage.value = data.message;
  } catch (error) { errorMessage.value = getApiErrorMessage(error); }
  finally { processing.value = false; }
}
async function previewAttachment(attachmentId: number) {
  if (!complaint.value) return;
  try {
    const { data } = await api.get<Blob>(`/complaints/${complaint.value.id}/attachments/${attachmentId}`, { headers: getAuthHeaders(), responseType: 'blob' });
    const url = URL.createObjectURL(data);
    const link = document.createElement('a');
    link.href = url; link.target = '_blank'; link.rel = 'noopener noreferrer'; link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 60000);
  } catch (error) { errorMessage.value = getApiErrorMessage(error); }
}
onMounted(loadDetail);
</script>

<template>
  <div class="min-h-screen bg-background md:grid md:grid-cols-[auto_minmax(0,1fr)]">
    <AppSidebar />
    <main class="min-w-0 px-5 py-7 sm:px-7 md:px-8 md:py-9 lg:px-10">
      <header class="border-b border-border pb-6"><RouterLink class="text-sm font-semibold text-primary-soft hover:text-primary" to="/kelola-keluhan">← Kembali ke Keluhan Masuk</RouterLink><div class="mt-4 flex flex-wrap items-start justify-between gap-4"><div><h1 class="text-2xl font-semibold text-primary">Penanganan Keluhan</h1><p v-if="complaint" class="mt-2 text-sm text-text-muted">KLH-{{ complaint.id }}</p></div><span v-if="complaint" :class="statusClass(complaint.status)">{{ statusLabel(complaint.status) }}</span></div></header>
      <div v-if="errorMessage" class="mt-5 rounded-lg bg-red-50 px-4 py-3 text-sm text-danger" role="alert">{{ errorMessage }}</div>
      <div v-if="successMessage" class="mt-5 flex items-center justify-between gap-4 rounded-lg bg-[#e7f2ef] px-4 py-3 text-sm text-success" role="status">
        <span>{{ successMessage }}</span>
        <button class="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-lg leading-none hover:bg-black/5" type="button" aria-label="Tutup notifikasi" @click="successMessage = ''">×</button>
      </div>
      <p v-if="loading" class="mt-7 text-sm text-text-muted">Memuat detail keluhan...</p>
      <div v-else-if="complaint" class="mt-7 grid gap-5 lg:grid-cols-[minmax(0,1fr)_350px]">
        <div class="space-y-5">
          <section class="rounded-2xl border border-border bg-surface p-5 sm:p-6">
            <h2 class="text-lg font-semibold text-primary">{{ complaint.subject }}</h2>
            <dl class="mt-5 grid overflow-hidden rounded-xl border border-border bg-surface-soft sm:grid-cols-3"><div class="p-4 sm:border-r sm:border-border"><dt class="text-xs uppercase tracking-wide text-text-muted">Pelapor</dt><dd class="mt-2 text-sm font-semibold text-primary">{{ complaint.reporter.name }}</dd><dd class="mt-1 text-xs text-text-muted">{{ complaint.reporter.employeeNumber }} · {{ complaint.reporter.department.name }}</dd></div><div class="border-t border-border p-4 sm:border-r sm:border-t-0"><dt class="text-xs uppercase tracking-wide text-text-muted">Kategori</dt><dd class="mt-2 text-sm font-medium text-text">{{ categoryLabel(complaint.category) }}</dd></div><div class="border-t border-border p-4 sm:border-t-0"><dt class="text-xs uppercase tracking-wide text-text-muted">Disampaikan</dt><dd class="mt-2 text-sm font-medium text-text">{{ formatDate(complaint.createdAt) }}</dd></div></dl>
            <div class="mt-5"><p class="text-xs uppercase tracking-wide text-text-muted">Deskripsi</p><p class="mt-2 whitespace-pre-wrap rounded-xl bg-surface-soft px-4 py-3.5 text-sm leading-6 text-text">{{ complaint.description }}</p></div>
            <div class="mt-6 border-t border-border pt-6"><h3 class="text-sm font-semibold text-primary">Lampiran</h3><p v-if="!complaint.attachments.length" class="mt-3 text-sm text-text-muted">Tidak ada lampiran.</p><div v-else class="mt-3 divide-y divide-border rounded-xl border border-border"><div v-for="file in complaint.attachments" :key="file.id" class="flex items-center justify-between gap-3 px-4 py-3"><div class="min-w-0"><p class="truncate text-sm font-medium text-text">{{ file.fileName }}</p><p class="mt-1 text-xs text-text-muted">{{ formatFileSize(file.sizeByte) }}</p></div><button class="rounded-lg border border-primary-soft px-3 py-2 text-xs font-semibold text-primary-soft" type="button" @click="previewAttachment(file.id)">Lihat</button></div></div></div>
          </section>
          <section class="rounded-2xl border border-border bg-surface p-5 sm:p-6"><h2 class="text-lg font-semibold text-primary">Catatan Penyelesaian</h2><p class="mt-2 text-sm text-text-muted">Simpan perkembangan atau hasil penanganan agar dapat dilihat oleh pelapor.</p><label class="mt-5 block"><span class="form-label">Resolution note</span><textarea v-model="resolutionNote" class="form-input min-h-32 resize-y" placeholder="Tuliskan tindak lanjut dan hasil penyelesaian"></textarea></label><div class="mt-5 flex justify-end"><button class="secondary-button" type="button" :disabled="processing" @click="updateComplaint()">Simpan Catatan</button></div></section>
        </div>
        <aside class="h-fit rounded-2xl border border-border bg-surface p-5 sm:p-6"><h2 class="text-base font-semibold text-primary">Status Penanganan</h2><dl class="mt-5 space-y-4"><div><dt class="text-xs uppercase tracking-wide text-text-muted">Handler</dt><dd class="mt-2 text-sm font-medium text-text">{{ complaint.handler?.name ?? 'Belum ditugaskan' }}</dd></div><div class="border-t border-border pt-4"><dt class="text-xs uppercase tracking-wide text-text-muted">Mulai ditinjau</dt><dd class="mt-2 text-sm text-text">{{ complaint.reviewedAt ? formatDate(complaint.reviewedAt) : 'Belum ditinjau' }}</dd></div></dl><div v-if="nextActions.length" class="mt-6 space-y-3 border-t border-border pt-5"><button v-for="action in nextActions" :key="action.status" class="primary-button w-full" type="button" :disabled="processing" @click="updateComplaint(action.status)">{{ action.label }}</button></div><p v-else class="mt-6 rounded-xl bg-surface-soft p-4 text-sm text-text-muted">Keluhan telah ditutup dan tidak memiliki tindakan lanjutan.</p></aside>
      </div>
    </main>
  </div>
</template>
