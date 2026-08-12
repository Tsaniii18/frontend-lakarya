<script setup lang="ts">
defineProps<{
  page: number;
  totalPages: number;
  loading?: boolean;
}>();
const emit = defineEmits<{ change: [page: number] }>();
</script>

<template>
  <div class="data-pagination">
    <p>Halaman <span class="font-semibold text-text">{{ page }}</span> dari {{ totalPages }}</p>
    <div class="flex items-center gap-2">
      <button class="secondary-button min-h-9 px-3 py-2" type="button" :disabled="page <= 1 || loading" @click="emit('change', page - 1)">Sebelumnya</button>
      <button class="secondary-button min-h-9 px-3 py-2" type="button" :disabled="page >= totalPages || loading" @click="emit('change', page + 1)">Berikutnya</button>
    </div>
  </div>
</template>
