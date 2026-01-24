<script setup lang="ts">
/**
 * Reusable filter select dropdown
 * Wraps shadcn Select with consistent styling and "All X" option
 */
import {
  Select,
  SelectContent,
  SelectItem,
  SelectItemText,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export interface FilterOption {
  value: string
  label: string
}

const props = defineProps<{
  /** Current selected value */
  modelValue: string
  /** Available options (value used for both if label not specified) */
  options: string[] | FilterOption[]
  /** Label shown above the select */
  label: string
  /** Placeholder text (also used for "All X" option) */
  placeholder: string
  /** Aria label for accessibility */
  ariaLabel: string
}>()

defineEmits<{
  'update:modelValue': [value: string]
}>()

/**
 * Normalize options to FilterOption format
 */
function normalizeOptions(options: string[] | FilterOption[]): FilterOption[] {
  return options.map(opt =>
    typeof opt === 'string' ? { value: opt, label: opt } : opt
  )
}
</script>

<template>
  <div class="filter-item">
    <label class="filter-label">{{ label }}</label>
    <Select
      :model-value="modelValue"
      @update:model-value="$emit('update:modelValue', $event)"
    >
      <SelectTrigger :aria-label="ariaLabel">
        <SelectValue :placeholder="placeholder" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">
          <SelectItemText>{{ placeholder }}</SelectItemText>
        </SelectItem>
        <SelectItem
          v-for="option in normalizeOptions(options)"
          :key="option.value"
          :value="option.value"
        >
          <SelectItemText>{{ option.label }}</SelectItemText>
        </SelectItem>
      </SelectContent>
    </Select>
  </div>
</template>

<style scoped>
.filter-item {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.filter-label {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--vp-c-text-1);
}
</style>
