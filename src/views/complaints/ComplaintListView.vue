<script setup lang="ts">
import { onMounted, ref } from 'vue';
import AppSidebar from '../../components/AppSidebar.vue';
import { getApiErrorMessage, getAuthHeaders } from '../../auth/auth';
import api from '../../lib/api';

type ComplaintStatus = 'TERBUKA' | 'DIPROSES' | 'SELESAI' | 'DITUTUP';
type ComplaintCategory = 'PERORANGAN' | 'FASILITAS' | 'LAINNYA';
interface ComplaintItem { id: number; subject: string; category: ComplaintCategory; status: ComplaintStatus; createdAt: string }

const complaints = ref<ComplaintItem[]>([]);
const meta = ref({ page: 1, limit: 10, total: 0, totalPages: 1 });
const page = ref(1);
const loading = ref(false);
const errorMessage = ref('');

function categoryLabel(value: ComplaintCategory) { return { PERORANGAN: 'Perorangan', FASILITAS: 'Fasilitas', LAINNYA: 'Lainnya' }[value]; }
function statusLabel(value: ComplaintStatus) { return { TERBUKA: 'Terbuka', DIPROSES: 'Diproses', SELESAI: 'Selesai', DITUTUP: 'Ditutup' }[value]; }
function statusClass(value: ComplaintStatus) { return value === 'TERBUKA' ? 'status-warning' : value === 'SELESAI' ? 'status-success' : 'status-info'; }
function formatDate(value: string) { return new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(value)); }

async function loadComplaints() {
  loading.value = true;
  errorMessage.value = '';
  try {
    const { data } = await api.get('/complaints', { headers: getAuthHeaders(), params: { page: page.value, limit: 10 } });
    complaints.value = data.data;
    meta.value = data.meta;
  } catch (error) { errorMessage.value = getApiErrorMessage(error); }
  finally { loading.value = false; }
}

function changePage(nextPage: number) {
  if (nextPage < 1 || nextPage > meta.value.totalPages) return;
  page.value = nextPage;
  void loadComplaints();
}

onMounted(loadComplaints);
</script>

<template>
  <div class="min-h-screen bg-background md:grid md:grid-cols-[auto_minmax(0,1fr)]">
    <AppSidebar />
    <main class="min-w-0 px-5 py-7 sm:px-7 md:px-8 md:py-9 lg:px-10">
      <header class="flex flex-wrap items-end justify-between gap-4 border-b border-border pb-6">
        <div><p class="text-sm font-medium text-primary-soft">Ruang Aspirasi</p><h1 class="mt-1 text-2xl font-semibold text-primary">Keluhan Saya</h1><p class="mt-2 text-sm text-text-muted">Sampaikan dan pantau tindak lanjut keluhan Anda.</p></div>
        <RouterLink class="primary-button" to="/keluhan/baru">Buat Keluhan</RouterLink>
      </header>

      <section class="data-card">
        <div class="data-card-heading"><div><h2 class="text-base font-semibold text-primary">Daftar Keluhan</h2><p class="mt-1 text-sm text-text-muted">Riwayat keluhan yang pernah Anda sampaikan.</p></div><span class="data-count">{{ meta.total }} keluhan</span></div>
        <div v-if="errorMessage" class="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-danger" role="alert">{{ errorMessage }}</div>
        <div class="data-table-shell">
          <table class="data-table min-w-[720px]">
            <thead><tr><th>Subjek</th><th>Kategori</th><th>Dibuat</th><th>Status</th><th class="text-right">Aksi</th></tr></thead>
            <tbody>
              <tr v-if="loading" class="data-state-row"><td colspan="5" class="py-10 text-center text-text-muted">Memuat keluhan...</td></tr>
              <tr v-else-if="complaints.length === 0" class="data-state-row"><td colspan="5" class="py-10 text-center"><p class="font-medium text-primary">Belum ada keluhan.</p><p class="mt-1 text-sm text-text-muted">Keluhan yang Anda buat akan muncul di sini.</p></td></tr>
              <template v-else><tr v-for="item in complaints" :key="item.id"><td><p class="font-medium text-primary">{{ item.subject }}</p><p class="mt-1 text-xs text-text-muted">KLH-{{ item.id }}</p></td><td class="text-text-muted">{{ categoryLabel(item.category) }}</td><td class="text-text-muted">{{ formatDate(item.createdAt) }}</td><td><span :class="statusClass(item.status)">{{ statusLabel(item.status) }}</span></td><td class="text-right"><RouterLink class="table-action-link" :to="`/keluhan/${item.id}`">Lihat detail</RouterLink></td></tr></template>
            </tbody>
          </table>
        </div>
        <div class="data-pagination"><p>Halaman {{ meta.page }} dari {{ meta.totalPages }}</p><div class="flex items-center gap-3"><button class="secondary-button min-h-9 px-3 py-2" type="button" :disabled="page <= 1 || loading" @click="changePage(page - 1)">Sebelumnya</button><button class="secondary-button min-h-9 px-3 py-2" type="button" :disabled="page >= meta.totalPages || loading" @click="changePage(page + 1)">Berikutnya</button></div></div>
      </section>
    </main>
  </div>
</template>
