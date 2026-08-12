<script setup lang="ts">
interface Option {
  value: string;
  label: string;
}

withDefaults(defineProps<{
  modelValue: string;
  options: Option[];
  label?: string;
}>(), {
  label: 'Tampilkan',
});

const emit = defineEmits<{ 'update:modelValue': [value: string] }>();

function updateValue(event: Event) {
  emit('update:modelValue', (event.target as HTMLSelectElement).value);
}
</script>

<template>
  <label>
    <span class="form-label">{{ label }}</span>
    <select class="form-input" :value="modelValue" @change="updateValue">
      <option v-for="option in options" :key="option.value" :value="option.value">
        {{ option.label }}
      </option>
    </select>
  </label>
</template>
