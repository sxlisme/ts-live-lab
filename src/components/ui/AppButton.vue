<script setup lang="ts">
import type { Component } from 'vue'

withDefaults(
  defineProps<{
    variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
    size?: 'sm' | 'md'
    icon?: Component
    loading?: boolean
    disabled?: boolean
    type?: 'button' | 'submit'
  }>(),
  {
    variant: 'secondary',
    size: 'md',
    type: 'button',
  },
)

defineEmits<{ click: [event: MouseEvent] }>()
</script>

<template>
  <button
    class="app-button"
    :class="[`button-${variant}`, `button-${size}`]"
    :type="type"
    :disabled="disabled || loading"
    @click="$emit('click', $event)"
  >
    <span v-if="loading" class="button-spinner" aria-hidden="true" />
    <component :is="icon" v-else-if="icon" :size="17" />
    <slot />
  </button>
</template>
