<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { authState, getApiErrorMessage, getAuthHeaders } from '../auth/auth';
import api from '../lib/api';

type ApprovalStatus = 'MENUNGGU' | 'DISETUJUI' | 'DITOLAK';
type RequestStatus = ApprovalStatus | 'DIBATALKAN';

interface ApprovalStep {
  id: number;
  stepOrder: number;
  status: ApprovalStatus;
  reviewNote: string | null;
  approver: { id: number };
}

const props = defineProps<{
  requestStatus: RequestStatus;
  approvals: ApprovalStep[];
}>();
const emit = defineEmits<{
  processed: [message: string];
}>();

const reviewNote = ref('');
const processing = ref(false);
const errorMessage = ref('');
const activeApproval = computed(
  () =>
    props.approvals.find(
      (approval) => approval.approver.id === authState.user?.id,
    ) ?? null,
);
const canProcess = computed(() => {
  const approval = activeApproval.value;
  if (
    !approval ||
    props.requestStatus !== 'MENUNGGU' ||
    approval.status !== 'MENUNGGU'
  ) {
    return false;
  }

  return props.approvals
    .filter((item) => item.stepOrder < approval.stepOrder)
    .every((item) => item.status === 'DISETUJUI');
});

watch(
  activeApproval,
  (approval) => {
    reviewNote.value = approval?.reviewNote ?? '';
  },
  { immediate: true },
);

async function processApproval(action: 'approve' | 'reject') {
  if (!canProcess.value || !activeApproval.value) return;
  processing.value = true;
  errorMessage.value = '';

  try {
    const { data } = await api.patch<{ message: string }>(
      `/approvals/${activeApproval.value.id}/${action}`,
      { reviewNote: reviewNote.value },
      { headers: getAuthHeaders() },
    );
    emit('processed', data.message);
  } catch (error) {
    errorMessage.value = getApiErrorMessage(error);
  } finally {
    processing.value = false;
  }
}
</script>

<template>
  <section v-if="canProcess" class="rounded-2xl border border-border bg-surface p-5 sm:p-6">
    <h2 class="text-lg font-semibold text-primary">Keputusan Persetujuan</h2>
    <p class="mt-1 text-sm text-text-muted">Tambahkan catatan sebelum memproses pengajuan ini.</p>

    <div v-if="errorMessage" class="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-danger" role="alert">
      {{ errorMessage }}
    </div>

    <label class="mt-5 block" for="request-review-note">
      <span class="form-label">Catatan review</span>
      <textarea
        id="request-review-note"
        v-model="reviewNote"
        class="form-input min-h-28 resize-y"
        placeholder="Tambahkan catatan (opsional)"
      ></textarea>
    </label>

    <div class="mt-5 flex flex-wrap justify-end gap-3">
      <button
        class="rounded-lg border border-danger px-4 py-2.5 text-sm font-semibold text-danger hover:bg-red-50"
        type="button"
        :disabled="processing"
        @click="processApproval('reject')"
      >
        {{ processing ? 'Memproses...' : 'Tolak' }}
      </button>
      <button
        class="primary-button"
        type="button"
        :disabled="processing"
        @click="processApproval('approve')"
      >
        {{ processing ? 'Memproses...' : 'Setujui' }}
      </button>
    </div>
  </section>
</template>
