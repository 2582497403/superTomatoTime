<script setup>
import { ref } from 'vue';

const props = defineProps({
  type: {
    type: Object,
    required: true
  },
  size: {
    type: String,
    default: '16px'
  },
  clickable: {
    type: Boolean,
    default: false
  }
});

const showTooltip = ref(false);

const handleMouseEnter = () => {
  showTooltip.value = true;
};

const handleMouseLeave = () => {
  showTooltip.value = false;
};
</script>

<template>
  <div 
    class="type-badge" 
    :class="{ 'clickable': clickable }"
    :style="{ fontSize: size }"
    :title="type.name"
    @mouseenter="handleMouseEnter"
    @mouseleave="handleMouseLeave"
  >
    {{ type.emoji }}
    <div v-if="showTooltip" class="tooltip">{{ type.name }}</div>
  </div>
</template>

<style scoped>
.type-badge {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: help;
  user-select: none;
}

.type-badge.clickable {
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  transition: background-color 0.2s;
}

.type-badge.clickable:hover {
  background-color: var(--bg-color);
}

.tooltip {
  position: absolute;
  bottom: 100%;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  white-space: nowrap;
  z-index: 100;
  pointer-events: none;
  margin-bottom: 6px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.2);
}

/* Triangle for tooltip */
.tooltip::after {
  content: '';
  position: absolute;
  top: 100%;
  left: 50%;
  margin-left: -4px;
  border-width: 4px;
  border-style: solid;
  border-color: rgba(0, 0, 0, 0.8) transparent transparent transparent;
}
</style>
