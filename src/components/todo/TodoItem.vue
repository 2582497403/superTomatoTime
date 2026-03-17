<script setup>
/**
 * TodoItem - 单个待办事项组件
 * 显示待办的复选框、类型徽章、文本内容，支持编辑和删除操作
 */

import { ref, computed } from 'vue';
import { useTodoTypes } from '../../composables/useTodoTypes';
import TypeBadge from './TypeBadge.vue';

// ==================== Props 定义 ====================
const props = defineProps({
  todo: {
    type: Object,
    required: true  // 待办对象（必需）
  }
});

// 引入待办类型管理工具
const { getTypeById } = useTodoTypes();

/**
 * 计算属性：获取当前待办的类型
 * @returns {Object|null} 待办类型对象或 null
 */
const todoType = computed(() => {
  if (props.todo.typeId) {
    return getTypeById(props.todo.typeId);
  }
  return null;
});

// ==================== Events 定义 ====================
const emit = defineEmits(['toggle', 'remove', 'update']); // 切换完成、删除、更新事件

// ==================== 编辑状态管理 ====================
// 是否正在编辑模式
const isEditing = ref(false);
// 编辑中的文本内容
const editedText = ref('');

/**
 * 切换完成状态
 */
const toggle = () => {
  emit('toggle', props.todo.id);
};

/**
 * 删除待办
 */
const remove = () => {
  emit('remove', props.todo.id);
};

/**
 * 开始编辑
 */
const startEdit = () => {
  isEditing.value = true;
  editedText.value = props.todo.text;
};

/**
 * 完成编辑（保存）
 */
const finishEdit = () => {
  if (editedText.value.trim()) {
    emit('update', props.todo.id, editedText.value.trim());
    isEditing.value = false;
  }
};

/**
 * 取消编辑
 */
const cancelEdit = () => {
  isEditing.value = false;
  editedText.value = props.todo.text;
};
</script>

<template>
  <!-- 待办项容器 -->
  <div class="todo-item" :class="{ 'completed': todo.completed }">
    <!-- 复选框区域 -->
    <div class="checkbox-container" @click="toggle">
      <div class="checkbox" :class="{ 'checked': todo.completed }">
        <!-- 完成时显示对勾图标 -->
        <svg v-if="todo.completed" viewBox="0 0 24 24" width="16" height="16">
          <path fill="white" d="M9,16.17L4.83,12l-1.42,1.41L9,19L21,7l-1.41-1.41L9,16.17Z" />
        </svg>
      </div>
    </div>
    
    <div class="content">
      <input 
        v-if="isEditing" 
        v-model="editedText" 
        @blur="finishEdit" 
        @keyup.enter="finishEdit"
        @keyup.esc="cancelEdit"
        class="edit-input"
        ref="editInput"
        autofocus
      />
      <div v-else class="text-container">
        <div class="main-row">
          <TypeBadge 
            v-if="todoType" 
            clickable
            :type="todoType" 
          />
          
          <span 
            class="text" 
            :class="{ 'strikethrough': todo.completed }"
            @dblclick="startEdit"
          >
            {{ todo.text }}
          </span>
        </div>
        <div class="meta-info">
          <span v-if="todo.pomodoros && todo.pomodoros > 0" class="pomodoro-count">
            🍅 x {{ todo.pomodoros }}
          </span>
          <span v-if="todo.rating && todo.rating > 0" class="rating-badge">
            ⭐ {{ todo.rating }}
          </span>
          <span v-if="todo.completed && todo.completedAt" class="completion-time">
            Done: {{ new Date(todo.completedAt).toLocaleString() }}
          </span>
        </div>
      </div>
    </div>

    <div class="actions">
      <button class="btn-icon btn-edit" @click="startEdit" title="Edit">
        <svg viewBox="0 0 24 24" width="18" height="18">
          <path fill="currentColor" d="M20.71,7.04C21.1,6.65 21.1,6 20.71,5.63L18.37,3.29C18,2.9 17.35,2.9 16.96,3.29L15.12,5.12L18.87,8.87M3,17.25V21H6.75L17.81,9.93L14.06,6.18L3,17.25Z" />
        </svg>
      </button>
      <button class="btn-icon btn-delete" @click="remove" title="Delete">
        <svg viewBox="0 0 24 24" width="18" height="18">
          <path fill="currentColor" d="M19,4H15.5L14.5,3H9.5L8.5,4H5V6H19M6,19A2,2 0 0,0 8,21H16A2,2 0 0,0 18,19V7H6V19Z" />
        </svg>
      </button>
    </div>
  </div>
</template>

<style scoped>
.todo-item {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  background: var(--card-bg);
  border-radius: var(--border-radius);
  margin-bottom: 8px;
  transition: all 0.2s ease;
  border: 1px solid var(--border-color);
  gap: 12px;
}

.todo-item:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.04);
  transform: translateY(-1px);
}

.checkbox-container {
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.checkbox {
  width: 20px;
  height: 20px;
  border: 2px solid var(--text-secondary);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.checkbox:hover {
  border-color: var(--primary-color);
}

.checkbox.checked {
  background-color: var(--success-color);
  border-color: var(--success-color);
}

.content {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.text {
  font-size: 16px;
  color: var(--text-primary);
  transition: color 0.2s;
  cursor: pointer;
}

.text.strikethrough {
  text-decoration: line-through;
  color: var(--text-secondary);
}

.text-container {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.main-row {
  display: flex;
  align-items: center;
  gap: 6px;
}

.meta-info {
  display: flex;
  gap: 12px;
  font-size: 12px;
  color: var(--text-secondary);
  align-items: center;
}

.pomodoro-count {
  background-color: rgba(255, 107, 107, 0.1);
  color: var(--primary-color);
  padding: 2px 6px;
  border-radius: 4px;
  font-weight: 600;
}

.rating-badge {
  background-color: rgba(255, 215, 0, 0.1);
  color: #d4af37;
  padding: 2px 6px;
  border-radius: 4px;
  font-weight: 600;
}

.completion-time {
  font-style: italic;
  font-size: 11px;
}

.edit-input {
  width: 100%;
  border: none;
  border-bottom: 2px solid var(--primary-color);
  background: transparent;
  font-size: 16px;
  color: var(--text-primary);
  outline: none;
  padding: 4px 0;
}

.actions {
  display: flex;
  gap: 8px;
  opacity: 0;
  transition: opacity 0.2s;
}

.todo-item:hover .actions {
  opacity: 1;
}

.btn-icon {
  background: none;
  border: none;
  padding: 4px;
  border-radius: 4px;
  cursor: pointer;
  color: var(--text-secondary);
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn-icon:hover {
  background-color: var(--bg-color);
  color: var(--text-primary);
}

.btn-delete:hover {
  color: var(--danger-color);
  background-color: rgba(250, 82, 82, 0.1);
}

.btn-edit:hover {
  color: var(--primary-color);
  background-color: rgba(255, 107, 107, 0.1);
}
</style>
