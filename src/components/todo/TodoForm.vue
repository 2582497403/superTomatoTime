<script setup>
import { ref, computed } from 'vue';
import { useTodoTypes } from '../../composables/useTodoTypes';
import TypeBadge from './TypeBadge.vue';

const emit = defineEmits(['add']);
const newTodo = ref('');
const selectedTypeId = ref('');
const showDropdown = ref(false);

const { todoTypes } = useTodoTypes();

// Set default type if available
if (todoTypes.value.length > 0) {
  selectedTypeId.value = todoTypes.value[0].id;
}

const selectedType = computed(() => {
  return todoTypes.value.find(t => t.id === selectedTypeId.value);
});

const selectType = (id) => {
  selectedTypeId.value = id;
  showDropdown.value = false;
};

const submit = () => {
  if (newTodo.value.trim()) {
    emit('add', newTodo.value, selectedTypeId.value);
    newTodo.value = '';
  }
};
</script>

<template>
  <div class="todo-form">
    <div v-if="todoTypes.length > 0" class="type-selector-container">
      <!-- Selected Type Display -->
      <div class="selected-type" @click="showDropdown = !showDropdown" title="选择类型">
        <TypeBadge 
          v-if="selectedType" 
          :type="selectedType" 
          clickable
          size="20px"
        />
        <span v-else class="placeholder-icon">📝</span>
      </div>

      <!-- Dropdown Overlay (to close on click outside) -->
      <div v-if="showDropdown" class="dropdown-overlay" @click="showDropdown = false"></div>

      <!-- Dropdown List -->
      <div v-if="showDropdown" class="type-dropdown">
        <div 
          v-for="type in todoTypes" 
          :key="type.id" 
          class="dropdown-item"
          :class="{ active: type.id === selectedTypeId }"
          @click.stop="selectType(type.id)"
        >
          <TypeBadge :type="type" clickable size="20px" />
        </div>
      </div>
    </div>

    <input 
      v-model="newTodo" 
      type="text" 
      placeholder="添加任务..." 
      @keyup.enter="submit"
    />
    <button class="btn-add" @click="submit" :disabled="!newTodo.trim()">
      <svg viewBox="0 0 24 24" width="20" height="20">
        <path fill="currentColor" d="M19,13H13V19H11V13H5V11H11V5H13V11H19V13Z" />
      </svg>
    </button>
  </div>
</template>

<style scoped>
.todo-form {
  display: flex;
  gap: 12px;
  background: var(--card-bg);
  padding: 16px;
  border-radius: var(--border-radius);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  margin-bottom: 24px;
  border: 1px solid var(--border-color);
  transition: all 0.3s ease;
}

.todo-form:focus-within {
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
  border-color: var(--primary-color);
}

.type-selector-container {
  position: relative;
  display: flex;
  align-items: center;
  margin-right: 8px;
}

.selected-type {
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  transition: background 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.selected-type:hover {
  background: var(--bg-color);
}

.placeholder-icon {
  font-size: 20px;
}

.dropdown-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  z-index: 100;
  cursor: default;
}

.type-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  background: var(--card-bg);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  padding: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  gap: 4px;
  z-index: 101;
  min-width: 40px;
}

.dropdown-item {
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  transition: background 0.2s;
}

.dropdown-item:hover {
  background: var(--bg-color);
}

.dropdown-item.active {
  background: rgba(255, 107, 107, 0.1);
}

input {
  flex: 1;
  border: none;
  background: transparent;
  font-size: 16px;
  outline: none;
  color: var(--text-primary);
}

input::placeholder {
  color: var(--text-secondary);
}

.btn-add {
  background: var(--primary-color);
  color: white;
  border: none;
  border-radius: 8px;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-add:hover:not(:disabled) {
  opacity: 0.9;
  transform: scale(1.05);
}

.btn-add:disabled {
  background: var(--border-color);
  color: var(--text-secondary);
  cursor: not-allowed;
}
</style>
