<script setup>
import { ref, computed } from 'vue';
import { useTodos } from '../../composables/useTodos';
import { useTodoTypes } from '../../composables/useTodoTypes';
import TypeBadge from './TypeBadge.vue';

const { todos, removeTodo } = useTodos();
const { getTypeById } = useTodoTypes();

// Filter states
const filterDate = ref('all'); // all, today, week, month
const filterRating = ref(0);   // 0 for all, 1-5 for specific stars
const currentPage = ref(1);
const pageSize = 20;

const setFilterDate = (val) => {
  filterDate.value = val;
  currentPage.value = 1;
};

const setFilterRating = (val) => {
  if (filterRating.value === val) {
    filterRating.value = 0; // toggle off
  } else {
    filterRating.value = val;
  }
  currentPage.value = 1;
};

// Computed: Filtered Completed Todos
const completedTodos = computed(() => {
  let list = todos.value.filter(t => t.completed);
  
  // Date Filter
  if (filterDate.value !== 'all') {
    const now = new Date();
    list = list.filter(t => {
      if (!t.completedAt) return false;
      const d = new Date(t.completedAt);
      
      if (filterDate.value === 'today') {
        return d.getDate() === now.getDate() && 
               d.getMonth() === now.getMonth() && 
               d.getFullYear() === now.getFullYear();
      }
      
      if (filterDate.value === 'week') {
        const oneDay = 24 * 60 * 60 * 1000;
        const diffDays = Math.round(Math.abs((now - d) / oneDay));
        return diffDays <= 7;
      }
      
      if (filterDate.value === 'month') {
        return d.getMonth() === now.getMonth() && 
               d.getFullYear() === now.getFullYear();
      }
      return true;
    });
  }
  
  // Rating Filter
  if (filterRating.value > 0) {
    list = list.filter(t => t.rating === filterRating.value);
  }
  
  // Sort by completedAt descending
  return list.slice().sort((a, b) => {
    const da = a.completedAt ? new Date(a.completedAt).getTime() : 0;
    const db = b.completedAt ? new Date(b.completedAt).getTime() : 0;
    return (db || 0) - (da || 0);
  });
});

// Computed: Pagination
const totalPages = computed(() => Math.ceil(completedTodos.value.length / pageSize));
const paginatedTodos = computed(() => {
  const start = (currentPage.value - 1) * pageSize;
  return completedTodos.value.slice(start, start + pageSize);
});

// Computed: Statistics
const stats = computed(() => {
  const list = completedTodos.value;
  const total = list.length;
  const totalRating = list.reduce((acc, cur) => acc + (cur.rating || 0), 0);
  const avgRating = total > 0 ? (totalRating / total).toFixed(1) : '0.0';
  
  // Consecutive days calculation (simplified)
  let streak = 0;
  if (list.length > 0) {
    const dates = [...new Set(list.map(t => {
      if (!t.completedAt) return null;
      try {
        const d = new Date(t.completedAt);
        return isNaN(d.getTime()) ? null : d.toDateString();
      } catch (e) {
        return null;
      }
    }).filter(d => d !== null))];
    streak = dates.length;
  }
  
  return { total, avgRating, streak };
});

const handleDelete = (id) => {
  if (confirm('确定要删除这条历史记录吗？此操作不可恢复。')) {
    removeTodo(id);
    // Adjust page if current page becomes empty
    if (paginatedTodos.value.length === 0 && currentPage.value > 1) {
      currentPage.value--;
    }
  }
};

const getTodoType = (typeId) => {
  if (!typeId) return null;
  const type = getTypeById(typeId);
  return type || null;
};

const formatDate = (isoString) => {
  if (!isoString) return '';
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return 'Invalid Date';
    return d.toLocaleString();
  } catch (e) {
    return 'Invalid Date';
  }
};

// Swipe to delete state
const touchStartX = ref(0);
const activeSwipeId = ref(null);

const handleTouchStart = (e, id) => {
  touchStartX.value = e.touches[0].clientX;
  activeSwipeId.value = id;
};

const handleTouchMove = (e) => {
  if (!activeSwipeId.value) return;
  const touchX = e.touches[0].clientX;
  const diff = touchStartX.value - touchX;
  
  const el = document.getElementById(`history-item-${activeSwipeId.value}`);
  if (el) {
    if (diff > 0 && diff < 100) {
       el.style.transform = `translateX(-${diff}px)`;
    }
  }
};

const handleTouchEnd = (e) => {
  if (!activeSwipeId.value) return;
  const touchX = e.changedTouches[0].clientX;
  const diff = touchStartX.value - touchX;
  
  const el = document.getElementById(`history-item-${activeSwipeId.value}`);
  
  if (diff > 80) {
     // Trigger delete confirm
     handleDelete(activeSwipeId.value);
  }
  
  if (el) {
    el.style.transform = '';
  }
  activeSwipeId.value = null;
};

</script>

<template>
  <div class="todo-history-panel">
    <!-- Statistics Header -->
    <div class="stats-header">
      <div class="stat-item">
        <span class="stat-value">{{ stats.total }}</span>
        <span class="stat-label">总完成</span>
      </div>
      <div class="stat-item">
        <span class="stat-value">⭐ {{ stats.avgRating }}</span>
        <span class="stat-label">平均星级</span>
      </div>
      <div class="stat-item">
        <span class="stat-value">{{ stats.streak }}</span>
        <span class="stat-label">活跃天数</span>
      </div>
    </div>

    <!-- Filters -->
    <div class="filters-section">
      <div class="date-filters">
        <button 
          v-for="f in ['all', 'today', 'week', 'month']" 
          :key="f"
          class="filter-chip" 
          :class="{ active: filterDate === f }"
          @click="setFilterDate(f)"
        >
          {{ f === 'all' ? '全部' : f === 'today' ? '今日' : f === 'week' ? '本周' : '本月' }}
        </button>
      </div>
      
      <div class="rating-filters">
        <button 
          v-for="r in 5" 
          :key="r"
          class="star-btn"
          :class="{ active: filterRating === r }"
          @click="setFilterRating(r)"
        >
          {{ filterRating === r ? '★' : '☆' }}{{ r }}
        </button>
      </div>
    </div>

    <!-- List Content -->
    <div class="history-list" v-if="paginatedTodos.length > 0">
      <div 
        v-for="todo in paginatedTodos" 
        :key="todo.id"
        :id="`history-item-${todo.id}`"
        class="history-item"
        @touchstart="handleTouchStart($event, todo.id)"
        @touchmove="handleTouchMove"
        @touchend="handleTouchEnd"
      >
        <div class="item-main">
          <div class="item-header">
            <div class="type-wrapper" v-if="todo.typeId && getTodoType(todo.typeId)">
              <TypeBadge :type="getTodoType(todo.typeId)" />
            </div>
            <span class="item-title">{{ todo.text }}</span>
            <span class="rating-badge" v-if="todo.rating">⭐ {{ todo.rating }}</span>
          </div>
          
          <div class="item-meta">
            <span class="time">{{ formatDate(todo.completedAt) }}</span>
            <span class="pomodoros" v-if="todo.pomodoros">🍅 x {{ todo.pomodoros }}</span>
          </div>
          
          <div class="item-comment" v-if="todo.comment">
            "{{ todo.comment }}"
          </div>
        </div>
        
        <button class="btn-delete" @click="handleDelete(todo.id)">
          🗑️
        </button>
      </div>
    </div>
    
    <!-- Empty State -->
    <div v-else class="empty-state">
      <div class="empty-icon">📭</div>
      <p>暂无已完成的待办事项</p>
    </div>

    <!-- Pagination -->
    <div v-if="totalPages > 1" class="pagination">
      <button 
        :disabled="currentPage === 1" 
        @click="currentPage--"
        class="page-btn"
      >
        上一页
      </button>
      <span class="page-info">{{ currentPage }} / {{ totalPages }}</span>
      <button 
        :disabled="currentPage === totalPages" 
        @click="currentPage++"
        class="page-btn"
      >
        下一页
      </button>
    </div>
  </div>
</template>

<style scoped>
.todo-history-panel {
  display: flex;
  flex-direction: column;
  gap: 16px;
  height: 100%;
}

.stats-header {
  display: flex;
  justify-content: space-around;
  background: var(--card-bg);
  padding: 16px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.stat-value {
  font-size: 20px;
  font-weight: bold;
  color: var(--primary-color);
}

.stat-label {
  font-size: 12px;
  color: var(--text-secondary);
  margin-top: 4px;
}

.filters-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.date-filters, .rating-filters {
  display: flex;
  gap: 8px;
  overflow-x: auto;
  padding-bottom: 4px;
}

.filter-chip {
  padding: 4px 12px;
  border-radius: 16px;
  border: 1px solid var(--border-color);
  background: var(--bg-color);
  color: var(--text-secondary);
  font-size: 13px;
  cursor: pointer;
  white-space: nowrap;
}

.filter-chip.active {
  background: var(--primary-color);
  color: white;
  border-color: var(--primary-color);
}

.star-btn {
  background: none;
  border: none;
  color: var(--text-secondary);
  cursor: pointer;
  font-size: 14px;
  padding: 4px 8px;
  border-radius: 4px;
}

.star-btn.active {
  color: #ffd700;
  background: rgba(255, 215, 0, 0.1);
  font-weight: bold;
}

.history-list {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.history-item {
  background: var(--card-bg);
  border-radius: 12px;
  padding: 12px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.03);
  position: relative;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  transition: transform 0.2s ease-out;
  touch-action: pan-y; /* Allow vertical scroll but capture horizontal swipe manually */
}

.item-main {
  flex: 1;
  min-width: 0; /* Enable text truncation */
}

.item-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
}

.item-title {
  font-weight: 600;
  font-size: 15px;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.rating-badge {
  font-size: 12px;
  background: rgba(255, 215, 0, 0.1);
  color: #d4af37;
  padding: 2px 6px;
  border-radius: 4px;
}

.item-meta {
  display: flex;
  gap: 12px;
  font-size: 12px;
  color: var(--text-secondary);
  margin-bottom: 6px;
}

.pomodoros {
  background: rgba(255, 107, 107, 0.1);
  color: var(--primary-color);
  padding: 0 4px;
  border-radius: 4px;
}

.item-comment {
  font-size: 13px;
  color: var(--text-secondary);
  font-style: italic;
  background: var(--bg-color);
  padding: 6px;
  border-radius: 6px;
}

.btn-delete {
  background: none;
  border: none;
  cursor: pointer;
  padding: 8px;
  opacity: 0.5;
  transition: opacity 0.2s;
}

.btn-delete:hover {
  opacity: 1;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px;
  color: var(--text-secondary);
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 16px;
  opacity: 0.5;
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 16px;
  margin-top: 16px;
}

.page-btn {
  padding: 6px 12px;
  border: 1px solid var(--border-color);
  background: var(--card-bg);
  border-radius: 6px;
  cursor: pointer;
}

.page-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.page-info {
  font-size: 14px;
  color: var(--text-secondary);
}
</style>
