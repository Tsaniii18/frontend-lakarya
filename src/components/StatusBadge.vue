<script setup lang="ts">
defineProps<{
  label: string;
  tone: 'info' | 'warning' | 'success' | 'danger';
}>();
</script>

<template>
  <span :class="`status-${tone}`">{{ label }}</span>
</template>
