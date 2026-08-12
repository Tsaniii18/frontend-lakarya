<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import AppSidebar from '../../components/AppSidebar.vue';
import ConfirmationModal from '../../components/ConfirmationModal.vue';
import DataListCard from '../../components/DataListCard.vue';
import DataPagination from '../../components/DataPagination.vue';
import ListState from '../../components/ListState.vue';
import PortalPageHeader from '../../components/PortalPageHeader.vue';
import StatusBadge from '../../components/StatusBadge.vue';
import { authState, getApiErrorMessage, getAuthHeaders } from '../../auth/auth';
import api from '../../lib/api';

interface UserItem {
  id: number;
  employeeNumber: string;
  name: string;
  email: string;
  accountStatus: 'MENUNGGU' | 'AKTIF' | 'DITANGGUHKAN' | 'DITOLAK';
  department: {
    id: number;
    name: string;
  };
  role: 'STAF' | 'MANAJER';
  createdAt: string;
}

interface UserListResponse {
  data: UserItem[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

type SortField =
  | 'name'
  | 'email'
  | 'employeeNumber'
  | 'department'
  | 'role'
  | 'accountStatus';

type ConfirmAction = 'approve' | 'reject' | 'suspend' | 'activate';

const departments = [
  'Human Resources',
  'Finance',
  'Information Technology',
  'Marketing',
];

const users = ref<UserItem[]>([]);
const meta = ref({ page: 1, limit: 10, total: 0, totalPages: 1 });
const page = ref(1);
const search = ref('');
const department = ref('');
const status = ref('');
const sort = ref<SortField>('name');
const order = ref<'asc' | 'desc'>('asc');
const loading = ref(false);
const actionUserId = ref<number | null>(null);
const errorMessage = ref('');
const successMessage = ref('');
const selectedUser = ref<UserItem | null>(null);
const confirmAction = ref<ConfirmAction | null>(null);
let searchTimer: ReturnType<typeof setTimeout> | undefined;

const confirmation = computed(() => {
  const user = selectedUser.value;
  const action = confirmAction.value;

  if (!user || !action) {
    return { title: '', message: '', label: '', danger: false };
  }

  if (action === 'approve') {
    const isRejected = user.accountStatus === 'DITOLAK';
    return {
      title: isRejected ? 'Terima kembali akun?' : 'Setujui akun?',
      message: `Akun ${user.name} akan menjadi aktif dan dapat masuk ke portal.`,
      label: isRejected ? 'Terima Akun' : 'Setujui',
      danger: false,
    };
  }

  if (action === 'activate') {
    return {
      title: 'Aktifkan kembali akun?',
      message: `Akun ${user.name} akan diaktifkan kembali dan dapat masuk ke portal.`,
      label: 'Aktifkan',
      danger: false,
    };
  }

  if (action === 'reject') {
    return {
      title: 'Tolak akun?',
      message: `Akun ${user.name} akan ditolak dan tidak dapat masuk ke portal.`,
      label: 'Tolak',
      danger: true,
    };
  }

  return {
    title: 'Tangguhkan akun?',
    message: `Akun ${user.name} tidak dapat masuk sampai diaktifkan kembali.`,
    label: 'Tangguhkan',
    danger: true,
  };
});

function statusLabel(statusValue: UserItem['accountStatus']) {
  return {
    MENUNGGU: 'Menunggu',
    AKTIF: 'Aktif',
    DITANGGUHKAN: 'Ditangguhkan',
    DITOLAK: 'Ditolak',
  }[statusValue];
}

function statusTone(statusValue: UserItem['accountStatus']) {
  if (statusValue === 'AKTIF') return 'success' as const;
  if (statusValue === 'MENUNGGU') return 'warning' as const;
  return 'danger' as const;
}

async function loadUsers() {
  loading.value = true;
  errorMessage.value = '';

  try {
    const { data } = await api.get<UserListResponse>('/users', {
      headers: getAuthHeaders(),
      params: {
        page: page.value,
        limit: 10,
        search: search.value || undefined,
        department: department.value || undefined,
        status: status.value || undefined,
        sort: sort.value,
        order: order.value,
      },
    });

    users.value = data.data;
    meta.value = data.meta;
  } catch (error) {
    errorMessage.value = getApiErrorMessage(error);
  } finally {
    loading.value = false;
  }
}

function openConfirmation(user: UserItem, action: ConfirmAction) {
  selectedUser.value = user;
  confirmAction.value = action;
}

function closeConfirmation() {
  if (actionUserId.value !== null) return;
  selectedUser.value = null;
  confirmAction.value = null;
}

async function executeConfirmedAction() {
  const user = selectedUser.value;
  const action = confirmAction.value;
  if (!user || !action) return;

  actionUserId.value = user.id;
  errorMessage.value = '';
  successMessage.value = '';

  try {
    const endpoint = {
      approve: 'approve',
      reject: 'reject',
      suspend: 'suspend',
      activate: 'activate',
    }[action];

    await api.patch(`/users/${user.id}/${endpoint}`, {}, { headers: getAuthHeaders() });
    successMessage.value = {
      approve:
        user.accountStatus === 'DITOLAK'
          ? `Akun ${user.name} berhasil diterima kembali.`
          : `Akun ${user.name} berhasil disetujui.`,
      reject: `Akun ${user.name} berhasil ditolak.`,
      suspend: `Akun ${user.name} berhasil ditangguhkan.`,
      activate: `Akun ${user.name} berhasil diaktifkan kembali.`,
    }[action];
    await loadUsers();
  } catch (error) {
    errorMessage.value = getApiErrorMessage(error);
  } finally {
    actionUserId.value = null;
    selectedUser.value = null;
    confirmAction.value = null;
  }
}

function toggleSort(field: SortField) {
  if (sort.value === field) {
    order.value = order.value === 'asc' ? 'desc' : 'asc';
    return;
  }

  sort.value = field;
  order.value = 'asc';
}

function sortIndicator(field: SortField) {
  if (sort.value !== field) return '↕';
  return order.value === 'asc' ? '↑' : '↓';
}

function changePage(nextPage: number) {
  if (nextPage < 1 || nextPage > meta.value.totalPages) return;
  page.value = nextPage;
  void loadUsers();
}

watch(search, () => {
  if (searchTimer) clearTimeout(searchTimer);
  searchTimer = setTimeout(() => {
    page.value = 1;
    void loadUsers();
  }, 400);
});

watch([department, status, sort, order], () => {
  page.value = 1;
  void loadUsers();
});

onBeforeUnmount(() => {
  if (searchTimer) clearTimeout(searchTimer);
});

onMounted(loadUsers);
</script>

<template>
  <div class="min-h-screen bg-background md:grid md:grid-cols-[auto_minmax(0,1fr)]">
    <AppSidebar />

    <main class="min-w-0 px-5 py-7 sm:px-7 md:px-8 md:py-9 lg:px-10">
      <PortalPageHeader
        eyebrow="Kelola HR"
        title="Akun Karyawan"
        description="Tinjau dan kelola akses akun seluruh karyawan dari satu tempat."
      />

      <DataListCard
        title="Semua Akun Karyawan"
        description="Cari karyawan, periksa informasi akun, lalu lakukan tindakan sesuai statusnya."
        :count="meta.total"
        count-label="akun"
      >
        <template #filters>
          <div class="grid gap-3 md:grid-cols-2 xl:grid-cols-[minmax(240px,1fr)_220px_190px]">
          <label>
            <span class="form-label">Cari karyawan</span>
            <input
              v-model="search"
              class="form-input"
              type="search"
              placeholder="Cari nama atau email"
            />
          </label>

          <label>
            <span class="form-label">Departemen</span>
            <select v-model="department" class="form-input">
              <option value="">Semua departemen</option>
              <option v-for="item in departments" :key="item" :value="item">{{ item }}</option>
            </select>
          </label>

          <label>
            <span class="form-label">Status</span>
            <select v-model="status" class="form-input">
              <option value="">Semua status</option>
              <option value="MENUNGGU">Menunggu</option>
              <option value="AKTIF">Aktif</option>
              <option value="DITANGGUHKAN">Ditangguhkan</option>
              <option value="DITOLAK">Ditolak</option>
            </select>
          </label>

          </div>
        </template>

        <div v-if="errorMessage" class="mt-4 flex items-start justify-between gap-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-danger" role="alert">
          <p>{{ errorMessage }}</p>
          <button class="shrink-0 text-lg leading-none" type="button" aria-label="Tutup pesan error" @click="errorMessage = ''">×</button>
        </div>
        <div v-if="successMessage" class="mt-4 flex items-start justify-between gap-4 rounded-lg bg-[#e7f2ef] px-4 py-3 text-sm text-success" role="status">
          <p>{{ successMessage }}</p>
          <button class="shrink-0 text-lg leading-none" type="button" aria-label="Tutup pemberitahuan" @click="successMessage = ''">×</button>
        </div>

        <div class="data-table-shell">
          <table class="data-table min-w-[1100px]">
            <thead>
              <tr>
                <th class="px-4 py-3">
                  <button class="flex items-center gap-2 hover:text-primary" type="button" @click="toggleSort('name')">
                    Nama <span aria-hidden="true">{{ sortIndicator('name') }}</span>
                  </button>
                </th>
                <th class="px-4 py-3">
                  <button class="flex items-center gap-2 hover:text-primary" type="button" @click="toggleSort('email')">
                    Email <span aria-hidden="true">{{ sortIndicator('email') }}</span>
                  </button>
                </th>
                <th class="px-4 py-3">
                  <button class="flex items-center gap-2 hover:text-primary" type="button" @click="toggleSort('employeeNumber')">
                    No. Pegawai <span aria-hidden="true">{{ sortIndicator('employeeNumber') }}</span>
                  </button>
                </th>
                <th class="px-4 py-3">
                  <button class="flex items-center gap-2 hover:text-primary" type="button" @click="toggleSort('department')">
                    Departemen <span aria-hidden="true">{{ sortIndicator('department') }}</span>
                  </button>
                </th>
                <th class="px-4 py-3">
                  <button class="flex items-center gap-2 hover:text-primary" type="button" @click="toggleSort('role')">
                    Peran <span aria-hidden="true">{{ sortIndicator('role') }}</span>
                  </button>
                </th>
                <th class="px-4 py-3">
                  <button class="flex items-center gap-2 hover:text-primary" type="button" @click="toggleSort('accountStatus')">
                    Status <span aria-hidden="true">{{ sortIndicator('accountStatus') }}</span>
                  </button>
                </th>
                <th class="px-4 py-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              <ListState v-if="loading" :colspan="7" loading loading-text="Memuat akun karyawan..." />
              <ListState
                v-else-if="users.length === 0"
                :colspan="7"
                icon="people"
                title="Akun karyawan tidak ditemukan"
                description="Coba ubah nama, email, atau filter yang dipilih."
              />
              <template v-else>
                <tr v-for="user in users" :key="user.id" class="text-text">
                  <td class="px-4 py-4 font-medium text-primary">{{ user.name }}</td>
                  <td class="px-4 py-4 text-text-muted">{{ user.email }}</td>
                  <td class="px-4 py-4 text-text-muted">{{ user.employeeNumber }}</td>
                  <td class="px-4 py-4">{{ user.department.name }}</td>
                  <td class="px-4 py-4">{{ user.role === 'MANAJER' ? 'Manajer' : 'Staf' }}</td>
                  <td class="px-4 py-4">
                    <StatusBadge :label="statusLabel(user.accountStatus)" :tone="statusTone(user.accountStatus)" />
                  </td>
                  <td class="px-4 py-4">
                    <div v-if="user.id !== authState.user?.id" class="flex justify-end gap-2">
                      <button
                        v-if="user.accountStatus === 'MENUNGGU'"
                        class="rounded-lg border border-success px-3 py-2 text-xs font-semibold text-success hover:bg-[#e7f2ef]"
                        type="button"
                        @click="openConfirmation(user, 'approve')"
                      >
                        Setujui
                      </button>
                      <button
                        v-if="user.accountStatus === 'MENUNGGU'"
                        class="rounded-lg border border-danger px-3 py-2 text-xs font-semibold text-danger hover:bg-red-50"
                        type="button"
                        @click="openConfirmation(user, 'reject')"
                      >
                        Tolak
                      </button>
                      <button
                        v-if="user.accountStatus === 'AKTIF'"
                        class="rounded-lg border border-danger px-3 py-2 text-xs font-semibold text-danger hover:bg-red-50"
                        type="button"
                        @click="openConfirmation(user, 'suspend')"
                      >
                        Tangguhkan
                      </button>
                      <button
                        v-if="user.accountStatus === 'DITOLAK'"
                        class="rounded-lg border border-success px-3 py-2 text-xs font-semibold text-success hover:bg-[#e7f2ef]"
                        type="button"
                        @click="openConfirmation(user, 'approve')"
                      >
                        Terima
                      </button>
                      <button
                        v-if="user.accountStatus === 'DITANGGUHKAN'"
                        class="rounded-lg border border-success px-3 py-2 text-xs font-semibold text-success hover:bg-[#e7f2ef]"
                        type="button"
                        @click="openConfirmation(user, 'activate')"
                      >
                        Aktifkan
                      </button>
                    </div>
                    <p v-else class="text-right text-xs text-text-muted">Akun Anda</p>
                  </td>
                </tr>
              </template>
            </tbody>
          </table>
        </div>

        <template #pagination>
          <DataPagination :page="meta.page" :total-pages="meta.totalPages" :loading="loading" @change="changePage" />
        </template>
      </DataListCard>
    </main>

    <ConfirmationModal
      :open="selectedUser !== null"
      :title="confirmation.title"
      :message="confirmation.message"
      :confirm-label="confirmation.label"
      :danger="confirmation.danger"
      :loading="actionUserId !== null"
      @close="closeConfirmation"
      @confirm="executeConfirmedAction"
    />
  </div>
</template>
