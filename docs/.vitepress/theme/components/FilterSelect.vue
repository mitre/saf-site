<script setup lang="ts">
/**
 * Reusable filter select dropdown
 * Wraps shadcn Select with consistent styling and "All X" option
 */
import { computed, useId } from 'vue'
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

const props = withDefaults(defineProps<{
  /** Current selected value */
  modelValue: string
  /** Available options (value used for both if label not specified) */
  options: string[] | FilterOption[]
  /** Label shown above the select */
  label: string
  /** Placeholder text (also used for "All X" option) */
  placeholder: string
  /** Aria label for accessibility (defaults to "Filter by {label}") */
  ariaLabel?: string
}>(), {
  ariaLabel: undefined,
})

defineEmits<{
  'update:modelValue': [value: string]
}>()

// Computed aria-label that falls back to a generated value
const computedAriaLabel = computed(() =>
  props.ariaLabel || `Filter by ${props.label.toLowerCase()}`,
)

// Unique id linking the visible <label> to the select trigger so clicking the
// label focuses the control and assistive tech announces them as a pair.
const triggerId = useId()

/**
 * Normalize options to FilterOption format
 */
function normalizeOptions(options: string[] | FilterOption[]): FilterOption[] {
  return options.map(opt =>
    typeof opt === 'string' ? { value: opt, label: opt } : opt,
  )
}
</script>

<template>
  <div class="filter-item">
    <label :for="triggerId" class="filter-label">{{ label }}</label>
    <!--
      Reka's <Select> renders no element of its own; the labelable control is
      <SelectTrigger> below, which carries the accessible name (aria-label) and
      is tied to the visible <label> via for/id. form-control-has-label only
      inspects `select`-typed nodes, so it false-positives on this wrapper.
    -->
    <!-- eslint-disable-next-line vuejs-accessibility/form-control-has-label -->
    <Select
      :model-value="modelValue"
      @update:model-value="$emit('update:modelValue', $event as string)"
    >
      <SelectTrigger :id="triggerId" :aria-label="computedAriaLabel">
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
