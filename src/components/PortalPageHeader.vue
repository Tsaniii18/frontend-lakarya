<script setup lang="ts">
defineProps<{
  eyebrow: string;
  title: string;
  description: string;
}>();
</script>

<template>
  <header class="flex flex-col gap-4 border-b border-border pb-6 sm:flex-row sm:items-end sm:justify-between">
    <div>
      <p class="text-sm font-medium text-primary-soft">{{ eyebrow }}</p>
      <h1 class="mt-1 text-2xl font-semibold text-primary">{{ title }}</h1>
      <p class="mt-2 text-sm leading-6 text-text-muted">{{ description }}</p>
    </div>
    <div v-if="$slots.actions" class="shrink-0 self-start sm:self-auto">
      <slot name="actions" />
    </div>
  </header>
</template>
