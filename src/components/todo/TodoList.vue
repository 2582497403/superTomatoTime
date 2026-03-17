<script setup>
import { ref, computed } from 'vue';
import { useTodos } from '../../composables/useTodos';
import TodoItem from './TodoItem.vue';
import TodoForm from './TodoForm.vue';

const { todos, addTodo, removeTodo, toggleTodo, updateTodoText } = useTodos();
const emit = defineEmits(['request-complete']);

const filter = ref('all');

const handleToggle = (id) => {
  const todo = todos.value.find(t => t.id === id);
  if (todo) {
    if (!todo.completed) {
      emit('request-complete', todo);
    } else {
      toggleTodo(id);
    }
  }
};

const handleRemove = (id) => {
  const todo = todos.value.find(t => t.id === id);
  if (todo) {
    if (confirm('确定要删除这个待办事项吗？')) {
      removeTodo(id);
    }
  }
};

const filteredTodos = computed(() => {
  switch (filter.value) {
    case 'active':
      return todos.value.filter(t => !t.completed);
    case 'completed':
      return todos.value.filter(t => t.completed);
    default:
      return todos.value;
  }
});

const activeCount = computed(() => todos.value.filter(t => !t.completed).length);

const setFilter = (f) => {
  filter.value = f;
};
</script>

<template>
  <div class="todo-list-container">
    <div class="sidebar">
      <div class="category-nav">
        <div 
          class="nav-item" 
          :class="{ active: filter === 'all' }"
          @click="setFilter('all')"
        >
          <span class="icon">📋</span>
          <span class="label">全部</span>
          <span class="count">{{ todos.length }}</span>
        </div>
        <div 
          class="nav-item" 
          :class="{ active: filter === 'active' }"
          @click="setFilter('active')"
        >
          <span class="icon">⚡</span>
          <span class="label">待办</span>
          <span class="count">{{ activeCount }}</span>
        </div>
        <div 
          class="nav-item" 
          :class="{ active: filter === 'completed' }"
          @click="setFilter('completed')"
        >
          <span class="icon">✅</span>
          <span class="label">已完成</span>
          <span class="count">{{ todos.length - activeCount }}</span>
        </div>
      </div>
    </div>

    <div class="main-content">
      <div class="header">
        <h2>{{ filter === 'all' ? '全部任务' : filter === 'active' ? '待办事项' : '已完成' }}</h2>
        <span class="date">{{ new Date().toLocaleDateString() }}</span>
      </div>
      
      <TodoForm @add="addTodo" />

      <div class="tasks-list">
        <div v-if="filteredTodos.length === 0" class="empty-state">
          <p>没有任务</p>
        </div>
        <transition-group name="list" tag="div">
          <TodoItem 
            v-for="todo in filteredTodos" 
            :key="todo.id" 
            :todo="todo"
            @toggle="handleToggle"
            @remove="handleRemove"
            @update="updateTodoText"
          />
        </transition-group>
      </div>
    </div>
  </div>
</template>

<style scoped>
.todo-list-container {
  display: flex;
  height: calc(100vh - 120px);
  min-height: 400px;
  gap: 24px;
}

.sidebar {
  width: 200px;
  border-right: 1px solid var(--border-color);
  padding-right: 16px;
}

.category-nav {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.nav-item {
  display: flex;
  align-items: center;
  padding: 10px 12px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  color: var(--text-secondary);
}

.nav-item:hover {
  background-color: var(--bg-color);
  color: var(--text-primary);
}

.nav-item.active {
  background-color: rgba(255, 107, 107, 0.1); /* Primary color light */
  color: var(--primary-color);
  font-weight: 600;
}

.nav-item .icon {
  margin-right: 12px;
  font-size: 18px;
}

.nav-item .label {
  flex: 1;
}

.nav-item .count {
  font-size: 12px;
  background: var(--bg-color);
  padding: 2px 8px;
  border-radius: 10px;
  color: var(--text-secondary);
}

.nav-item.active .count {
  background: white;
  color: var(--primary-color);
}

.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.header h2 {
  margin: 0;
  font-size: 24px;
  color: var(--header-text);
}

.date {
  color: var(--text-secondary);
  font-size: 14px;
}

.tasks-list {
  flex: 1;
  overflow-y: auto;
}

.empty-state {
  text-align: center;
  color: var(--text-secondary);
  margin-top: 40px;
}

/* List Transitions */
.list-enter-active,
.list-leave-active {
  transition: all 0.3s ease;
}

.list-enter-from,
.list-leave-to {
  opacity: 0;
  transform: translateX(30px);
}
</style>
