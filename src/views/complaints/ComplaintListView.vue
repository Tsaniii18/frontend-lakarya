<script setup lang="ts">
import { onMounted, ref } from 'vue';
import AppSidebar from '../../components/AppSidebar.vue';
import DataListCard from '../../components/DataListCard.vue';
import DataPagination from '../../components/DataPagination.vue';
import ListState from '../../components/ListState.vue';
import PortalPageHeader from '../../components/PortalPageHeader.vue';
import StatusBadge from '../../components/StatusBadge.vue';
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
function statusTone(value: ComplaintStatus) { return value === 'TERBUKA' ? 'warning' as const : value === 'SELESAI' ? 'success' as const : 'info' as const; }
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
      <PortalPageHeader eyebrow="Ruang Aspirasi" title="Keluhan Saya" description="Sampaikan dan pantau tindak lanjut keluhan Anda."><template #actions><RouterLink class="primary-button" to="/keluhan/baru">Buat Keluhan</RouterLink></template></PortalPageHeader>

      <DataListCard title="Riwayat Keluhan Saya" description="Keluhan yang pernah Anda sampaikan beserta status tindak lanjutnya." :count="meta.total" count-label="keluhan">
        <div v-if="errorMessage" class="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-danger" role="alert">{{ errorMessage }}</div>
        <div class="data-table-shell">
          <table class="data-table min-w-[720px]">
            <thead><tr><th>Subjek</th><th>Kategori</th><th>Dibuat</th><th>Status</th><th class="text-right">Aksi</th></tr></thead>
            <tbody>
              <ListState v-if="loading" :colspan="5" loading loading-text="Memuat keluhan..." />
              <ListState v-else-if="complaints.length === 0" :colspan="5" icon="complaint" title="Belum ada keluhan" description="Keluhan yang Anda buat akan muncul di sini." />
              <template v-else><tr v-for="item in complaints" :key="item.id"><td><p class="font-medium text-primary">{{ item.subject }}</p><p class="mt-1 text-xs text-text-muted">KLH-{{ item.id }}</p></td><td class="text-text-muted">{{ categoryLabel(item.category) }}</td><td class="text-text-muted">{{ formatDate(item.createdAt) }}</td><td><StatusBadge :label="statusLabel(item.status)" :tone="statusTone(item.status)" /></td><td class="text-right"><RouterLink class="table-action-link" :to="`/keluhan/${item.id}`">Lihat detail</RouterLink></td></tr></template>
            </tbody>
          </table>
        </div>
        <template #pagination><DataPagination :page="meta.page" :total-pages="meta.totalPages" :loading="loading" @change="changePage" /></template>
      </DataListCard>
    </main>
  </div>
</template>
