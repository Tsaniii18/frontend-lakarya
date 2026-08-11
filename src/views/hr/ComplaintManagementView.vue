<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue';
import AppSidebar from '../../components/AppSidebar.vue';
import { getApiErrorMessage, getAuthHeaders } from '../../auth/auth';
import api from '../../lib/api';

type ComplaintStatus = 'TERBUKA' | 'DIPROSES' | 'SELESAI' | 'DITUTUP';
type ComplaintCategory = 'PERORANGAN' | 'FASILITAS' | 'LAINNYA';
interface ComplaintItem { id: number; subject: string; category: ComplaintCategory; status: ComplaintStatus; createdAt: string; reporter: { name: string; department: { name: string } } }

const complaints = ref<ComplaintItem[]>([]);
const meta = ref({ page: 1, limit: 10, total: 0, totalPages: 1 });
const page = ref(1);
const category = ref('');
const status = ref('');
const search = ref('');
const order = ref<'asc' | 'desc'>('desc');
const loading = ref(false);
const errorMessage = ref('');
let searchTimer: ReturnType<typeof setTimeout> | undefined;

function categoryLabel(value: ComplaintCategory) { return { PERORANGAN: 'Perorangan', FASILITAS: 'Fasilitas', LAINNYA: 'Lainnya' }[value]; }
function statusLabel(value: ComplaintStatus) { return { TERBUKA: 'Terbuka', DIPROSES: 'Diproses', SELESAI: 'Selesai', DITUTUP: 'Ditutup' }[value]; }
function statusClass(value: ComplaintStatus) { return value === 'TERBUKA' ? 'status-warning' : value === 'SELESAI' ? 'status-success' : 'status-info'; }
function formatDate(value: string) { return new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(value)); }

async function loadComplaints() {
  loading.value = true;
  errorMessage.value = '';
  try {
    const { data } = await api.get('/manage/complaints', { headers: getAuthHeaders(), params: { page: page.value, limit: 10, category: category.value || undefined, status: status.value || undefined, search: search.value.trim() || undefined, sort: 'createdAt', order: order.value } });
    complaints.value = data.data;
    meta.value = data.meta;
  } catch (error) { errorMessage.value = getApiErrorMessage(error); }
  finally { loading.value = false; }
}
function changePage(nextPage: number) { if (nextPage < 1 || nextPage > meta.value.totalPages) return; page.value = nextPage; void loadComplaints(); }
watch([category, status, order], () => { page.value = 1; void loadComplaints(); });
watch(search, () => { page.value = 1; if (searchTimer) clearTimeout(searchTimer); searchTimer = setTimeout(() => void loadComplaints(), 400); });
onBeforeUnmount(() => { if (searchTimer) clearTimeout(searchTimer); });
onMounted(loadComplaints);
</script>

<template>
  <div class="min-h-screen bg-background md:grid md:grid-cols-[auto_minmax(0,1fr)]">
    <AppSidebar />
    <main class="min-w-0 px-5 py-7 sm:px-7 md:px-8 md:py-9 lg:px-10">
      <header class="border-b border-border pb-6"><p class="text-sm font-medium text-primary-soft">Human Resources</p><h1 class="mt-1 text-2xl font-semibold text-primary">Keluhan Masuk</h1><p class="mt-2 text-sm text-text-muted">Pantau dan tindak lanjuti keluhan yang disampaikan karyawan.</p></header>
      <section class="data-card">
        <div class="data-card-heading"><div><h2 class="text-base font-semibold text-primary">Daftar Keluhan Karyawan</h2><p class="mt-1 text-sm text-text-muted">Cari dan filter keluhan berdasarkan kebutuhan penanganan.</p></div><span class="data-count">{{ meta.total }} keluhan</span></div>
        <div class="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <label><span class="form-label">Cari subjek</span><input v-model="search" class="form-input" type="search" placeholder="Cari subjek keluhan" /></label>
          <label><span class="form-label">Kategori</span><select v-model="category" class="form-input"><option value="">Semua kategori</option><option value="PERORANGAN">Perorangan</option><option value="FASILITAS">Fasilitas</option><option value="LAINNYA">Lainnya</option></select></label>
          <label><span class="form-label">Status</span><select v-model="status" class="form-input"><option value="">Semua status</option><option value="TERBUKA">Terbuka</option><option value="DIPROSES">Diproses</option><option value="SELESAI">Selesai</option><option value="DITUTUP">Ditutup</option></select></label>
          <label><span class="form-label">Urutan</span><select v-model="order" class="form-input"><option value="desc">Terbaru</option><option value="asc">Terlama</option></select></label>
        </div>
        <div v-if="errorMessage" class="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-danger" role="alert">{{ errorMessage }}</div>
        <div class="data-table-shell"><table class="data-table min-w-[820px]"><thead><tr><th>Keluhan</th><th>Pelapor</th><th>Kategori</th><th>Dibuat</th><th>Status</th><th class="text-right">Aksi</th></tr></thead><tbody>
          <tr v-if="loading" class="data-state-row"><td colspan="6" class="py-10 text-center text-text-muted">Memuat keluhan...</td></tr>
          <tr v-else-if="complaints.length === 0" class="data-state-row"><td colspan="6" class="py-10 text-center"><p class="font-medium text-primary">Keluhan tidak ditemukan.</p><p class="mt-1 text-sm text-text-muted">Coba ubah pencarian atau filter yang digunakan.</p></td></tr>
          <template v-else><tr v-for="item in complaints" :key="item.id"><td><p class="font-medium text-primary">{{ item.subject }}</p><p class="mt-1 text-xs text-text-muted">KLH-{{ item.id }}</p></td><td><p class="text-text">{{ item.reporter.name }}</p><p class="mt-1 text-xs text-text-muted">{{ item.reporter.department.name }}</p></td><td class="text-text-muted">{{ categoryLabel(item.category) }}</td><td class="text-text-muted">{{ formatDate(item.createdAt) }}</td><td><span :class="statusClass(item.status)">{{ statusLabel(item.status) }}</span></td><td class="text-right"><RouterLink class="table-action-link" :to="`/kelola-keluhan/${item.id}`">Tinjau</RouterLink></td></tr></template>
        </tbody></table></div>
        <div class="data-pagination"><p>Halaman {{ meta.page }} dari {{ meta.totalPages }}</p><div class="flex items-center gap-3"><button class="secondary-button min-h-9 px-3 py-2" type="button" :disabled="page <= 1 || loading" @click="changePage(page - 1)">Sebelumnya</button><button class="secondary-button min-h-9 px-3 py-2" type="button" :disabled="page >= meta.totalPages || loading" @click="changePage(page + 1)">Berikutnya</button></div></div>
      </section>
    </main>
  </div>
</template>
