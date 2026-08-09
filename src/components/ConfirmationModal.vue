<script setup lang="ts">
defineProps<{
  open: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  danger?: boolean;
  loading?: boolean;
}>();

defineEmits<{
  close: [];
  confirm: [];
}>();
</script>

<template>
  <Teleport to="body">
    <div
      v-if="open"
      class="fixed inset-0 z-[100] flex items-center justify-center bg-primary/45 px-5 py-8"
      role="presentation"
      @click.self="$emit('close')"
    >
      <section
        class="w-full max-w-md rounded-2xl border border-border bg-surface p-6 shadow-[0_24px_70px_rgba(15,39,71,0.25)]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirmation-title"
        aria-describedby="confirmation-message"
      >
        <h2 id="confirmation-title" class="text-lg font-semibold text-primary">{{ title }}</h2>
        <p id="confirmation-message" class="mt-3 text-sm leading-6 text-text-muted">{{ message }}</p>

        <div class="mt-6 flex justify-end gap-3">
          <button class="secondary-button" type="button" :disabled="loading" @click="$emit('close')">
            Batal
          </button>
          <button
            class="min-h-11 rounded-lg px-4 text-sm font-semibold text-white"
            :class="danger ? 'bg-danger hover:bg-[#a43f3d]' : 'bg-primary hover:bg-primary-hover'"
            type="button"
            :disabled="loading"
            @click="$emit('confirm')"
          >
            {{ loading ? 'Memproses...' : confirmLabel }}
          </button>
        </div>
      </section>
    </div>
  </Teleport>
</template>
