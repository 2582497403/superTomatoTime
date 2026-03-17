<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';

const props = defineProps({
  history: {
    type: Array,
    required: true
  }
});

const emit = defineEmits(['delete']);

// 控制日期选择器弹窗
const showDatePicker = ref(false);
// 选择器内部展示的年份
const pickerYear = ref(new Date().getFullYear());
// 当前查看的年月 (默认当前月)
const viewDate = ref(new Date());
// 选中日期状态 (默认当天)
const selectedDay = ref(new Date().getDate());

// 月份名称列表
const monthNames = ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月'];

// 获取当前月份信息
const currentMonthInfo = computed(() => {
  const year = viewDate.value.getFullYear();
  const month = viewDate.value.getMonth();
  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);
  
  return {
    year,
    month: month + 1,
    firstDayWeek: firstDayOfMonth.getDay(),
    totalDays: lastDayOfMonth.getDate()
  };
});

// 聚合当月历史数据
const heatmapData = computed(() => {
  const data = {};
  const info = currentMonthInfo.value;
  
  props.history.forEach(item => {
    try {
      const [datePart] = item.work_start_time.split(' ');
      const dateStr = datePart.replace(/\//g, '-');
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return;
      
      if (d.getFullYear() === info.year && (d.getMonth() + 1) === info.month) {
        const day = d.getDate();
        data[day] = (data[day] || 0) + 1;
      }
    } catch (e) {
      console.error("Parse date error:", e);
    }
  });

  const days = [];
  const firstDay = info.firstDayWeek === 0 ? 6 : info.firstDayWeek - 1;
  for (let i = 0; i < firstDay; i++) {
    days.push({ padding: true });
  }

  for (let i = 1; i <= info.totalDays; i++) {
    days.push({
      day: i,
      count: data[i] || 0,
      date: `${info.year}-${String(info.month).padStart(2, '0')}-${String(i).padStart(2, '0')}`
    });
  }
  return days;
});

// 获取选中日期的详细记录
const selectedDayRecords = computed(() => {
  const info = currentMonthInfo.value;
  return props.history.filter(item => {
    try {
      const [datePart] = item.work_start_time.split(' ');
      const dateStr = datePart.replace(/\//g, '-');
      const d = new Date(dateStr);
      return d.getFullYear() === info.year && 
             (d.getMonth() + 1) === info.month && 
             d.getDate() === selectedDay.value;
    } catch (e) {
      return false;
    }
  });
});

const getColorLevel = (count) => {
  if (count === 0) return 0;
  if (count <= 2) return 1;
  if (count <= 4) return 2;
  if (count <= 6) return 3;
  return 4;
};

// 触发日期选择器
const toggleDatePicker = () => {
  showDatePicker.value = !showDatePicker.value;
  if (showDatePicker.value) {
    pickerYear.value = viewDate.value.getFullYear();
  }
};

// 选择月份
const selectMonth = (monthIndex) => {
  const newDate = new Date(pickerYear.value, monthIndex, 1);
  viewDate.value = newDate;
  showDatePicker.value = false;
  
  const today = new Date();
  if (pickerYear.value === today.getFullYear() && monthIndex === today.getMonth()) {
    selectedDay.value = today.getDate();
  } else {
    selectedDay.value = 1;
  }
};

// 切换年份
const changePickerYear = (offset) => {
  pickerYear.value += offset;
};

// 跳转到本月
const goToCurrentMonth = () => {
  const today = new Date();
  viewDate.value = new Date(today.getFullYear(), today.getMonth(), 1);
  pickerYear.value = today.getFullYear();
  selectedDay.value = today.getDate();
  showDatePicker.value = false;
};

const handleDayClick = (day) => {
  selectedDay.value = day;
};

const changeMonth = (offset) => {
  const newDate = new Date(viewDate.value);
  newDate.setMonth(newDate.getMonth() + offset);
  viewDate.value = newDate;
  
  const today = new Date();
  if (newDate.getFullYear() === today.getFullYear() && newDate.getMonth() === today.getMonth()) {
    selectedDay.value = today.getDate();
  } else {
    selectedDay.value = 1;
  }
};

const handleDelete = (id) => {
  if (confirm('确定要删除这条记录吗？')) {
    emit('delete', id);
  }
};

// 点击外部关闭弹窗
const handleClickOutside = (e) => {
  const picker = document.querySelector('.datepicker-popover');
  const trigger = document.querySelector('.month-selector-wrapper');
  if (showDatePicker.value && picker && !picker.contains(e.target) && !trigger.contains(e.target)) {
    showDatePicker.value = false;
  }
};

onMounted(() => document.addEventListener('click', handleClickOutside));
onUnmounted(() => document.removeEventListener('click', handleClickOutside));
</script>

<template>
  <div class="history-panel card">
    <div class="panel-header">
      <div class="month-nav">
        <button class="nav-btn" @click="changeMonth(-1)" title="上个月">
          <svg viewBox="0 0 24 24" width="16" height="16">
            <path fill="currentColor" d="M15.41,16.58L10.83,12L15.41,7.41L14,6L8,12L14,18L15.41,16.58Z" />
          </svg>
        </button>
        
        <div class="month-selector-wrapper" @click.stop="toggleDatePicker">
          <span class="month-display">{{ currentMonthInfo.year }}年 {{ currentMonthInfo.month }}月</span>
          
          <!-- Element UI 风格选择器弹窗 -->
          <Transition name="fade-up">
            <div v-if="showDatePicker" class="datepicker-popover" @click.stop>
              <div class="datepicker-header">
                <button class="picker-nav-btn" @click="changePickerYear(-1)">
                  <svg viewBox="0 0 24 24" width="14" height="14">
                    <path fill="currentColor" d="M18.41,16.59L13.82,12L18.41,7.41L17,6L11,12L17,18L18.41,16.59M12.41,16.59L7.82,12L12.41,7.41L11,6L5,12L11,18L12.41,16.59Z" />
                  </svg>
                </button>
                <div class="picker-header-center">
                  <span class="picker-year-title">{{ pickerYear }}年</span>
                  <button class="btn-text-shortcut" @click="goToCurrentMonth">本月</button>
                </div>
                <button class="picker-nav-btn" @click="changePickerYear(1)">
                  <svg viewBox="0 0 24 24" width="14" height="14">
                    <path fill="currentColor" d="M5.59,16.59L10.18,12L5.59,7.41L7,6L13,12L7,18L5.59,16.59M11.59,16.59L16.18,12L11.59,7.41L13,6L19,12L13,18L11.59,16.59Z" />
                  </svg>
                </button>
              </div>
              <div class="month-grid">
                <div 
                  v-for="(name, index) in monthNames" 
                  :key="name" 
                  class="month-cell"
                  :class="{ 
                    'is-current': viewDate.getFullYear() === pickerYear && viewDate.getMonth() === index,
                    'is-today': new Date().getFullYear() === pickerYear && new Date().getMonth() === index
                  }"
                  @click="selectMonth(index)"
                >
                  {{ name }}
                </div>
              </div>
            </div>
          </Transition>
        </div>

        <button class="nav-btn" @click="changeMonth(1)" title="下个月">
          <svg viewBox="0 0 24 24" width="16" height="16">
            <path fill="currentColor" d="M8.59,16.58L13.17,12L8.59,7.41L10,6L16,12L10,18L8.59,16.58Z" />
          </svg>
        </button>
      </div>
      <div class="legend">
        <div class="cell level-0"></div>
        <div class="cell level-1"></div>
        <div class="cell level-2"></div>
        <div class="cell level-3"></div>
        <div class="cell level-4"></div>
      </div>
    </div>

    <div class="month-heatmap">
      <div class="weekday-labels">
        <span>一</span><span>二</span><span>三</span><span>四</span><span>五</span><span>六</span><span>日</span>
      </div>
      <div class="calendar-grid">
        <div 
          v-for="(item, index) in heatmapData" 
          :key="index"
          class="cell-wrapper"
        >
          <div 
            v-if="!item.padding"
            class="cell"
            :class="[
              'level-' + getColorLevel(item.count),
              { 'is-selected': selectedDay === item.day }
            ]"
            @click="handleDayClick(item.day)"
            :title="`${item.day}日: ${item.count} 轮专注`"
          >
            <span class="day-num">{{ item.day }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 选中日期的详细列表 -->
    <div class="day-details">
      <div class="details-header">
        <h4>{{ selectedDay }}日 专注详情</h4>
        <span class="count-badge">{{ selectedDayRecords.length }} 轮</span>
      </div>
      
      <div v-if="selectedDayRecords.length > 0" class="records-list">
        <div v-for="record in selectedDayRecords" :key="record.id" class="record-item">
          <div class="record-meta">
            <span class="round-num">{{ record.work_start_time.split(' ')[1] }}</span>
            <span class="record-time">工作时间: {{ record.work_duration_minutes }} 分钟 休息时间: {{ record.rest_duration_minutes }} 分钟</span>
            <button class="btn-delete-mini" @click="handleDelete(record.id)" title="删除">
              <svg viewBox="0 0 24 24" width="14" height="14">
                <path fill="currentColor" d="M19,4H15.5L14.5,3H9.5L8.5,4H5V6H19V4M6,19A2,2 0 0,0 8,21H16A2,2 0 0,0 18,19V7H6V19Z" />
              </svg>
            </button>
          </div>
          <div class="record-content">
            <p v-if="record.work_plan"><strong>计划:</strong> {{ record.work_plan }}</p>
            <p v-if="record.work_summary"><strong>总结:</strong> {{ record.work_summary }}</p>
          </div>
        </div>
      </div>
      <div v-else class="empty-details">
        该日暂无专注记录
      </div>
    </div>
    
    <div v-if="history.length === 0" class="empty-state">本月还没有专注记录</div>
  </div>
</template>

<style scoped>
.history-panel {
  padding: 24px;
  background: var(--card-bg);
  border-radius: var(--border-radius);
  border: 1px solid var(--border-color);
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.04);
  position: relative;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.month-nav {
  display: flex;
  align-items: center;
  gap: 12px;
}

.nav-btn {
  background: var(--bg-color);
  border: 1px solid var(--border-color);
  color: var(--text-primary);
  border-radius: 6px;
  padding: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.nav-btn:hover {
  background: var(--border-color);
  border-color: var(--text-secondary);
}

.month-selector-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 120px;
  cursor: pointer;
}

.month-display {
  font-size: 18px;
  font-weight: 700;
  color: var(--header-text);
  letter-spacing: -0.01em;
  text-align: center;
  padding: 4px 12px;
  border-radius: 8px;
  transition: all 0.2s;
}

.month-selector-wrapper:hover .month-display {
  background: var(--bg-color);
  color: var(--primary-color);
}

/* Element UI 风格选择器弹窗 */
.datepicker-popover {
  position: absolute;
  top: 100%;
  left: 50%;
  transform: translateX(-50%) translateY(10px);
  background: var(--card-bg);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.15);
  padding: 12px;
  z-index: 1000;
  width: 280px;
}

.datepicker-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 4px 12px;
  border-bottom: 1px solid var(--border-color);
  margin-bottom: 12px;
}

.picker-header-center {
  display: flex;
  align-items: center;
  gap: 8px;
}

.picker-year-title {
  font-size: 14px;
  font-weight: 700;
  color: var(--header-text);
}

.btn-text-shortcut {
  background: none;
  border: none;
  color: var(--primary-color);
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  padding: 2px 6px;
  border-radius: 4px;
  transition: all 0.2s;
}

.btn-text-shortcut:hover {
  background: var(--bg-color);
  text-decoration: underline;
}

.picker-nav-btn {
  background: none;
  border: none;
  color: var(--text-secondary);
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  transition: all 0.2s;
}

.picker-nav-btn:hover {
  color: var(--primary-color);
  background: var(--bg-color);
}

.month-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}

.month-cell {
  padding: 12px 0;
  text-align: center;
  font-size: 13px;
  color: var(--text-primary);
  border-radius: 8px;
  transition: all 0.2s;
}

.month-cell:hover {
  color: var(--primary-color);
  background: var(--bg-color);
}

.month-cell.is-current {
  background: var(--primary-color);
  color: #fff !important;
  font-weight: 700;
}

.month-cell.is-today {
  color: var(--primary-color);
  font-weight: 700;
}

/* 动画效果 */
.fade-up-enter-active, .fade-up-leave-active {
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}
.fade-up-enter-from, .fade-up-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(20px);
}

.legend {
  display: flex;
  gap: 4px;
  background: var(--bg-color);
  padding: 6px;
  border-radius: 8px;
}

.legend .cell {
  width: 10px;
  height: 10px;
  border-radius: 2px;
}

.month-heatmap {
  user-select: none;
  max-width: 360px;
  margin: 0 auto 24px;
}

.weekday-labels {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  margin-bottom: 16px;
  text-align: center;
}

.weekday-labels span {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-secondary);
  opacity: 0.8;
}

.calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 12px;
}

.cell-wrapper {
  aspect-ratio: 1;
  display: flex;
  justify-content: center;
  align-items: center;
}

.cell {
  width: 100%;
  height: 100%;
  max-width: 38px;
  max-height: 38px;
  border-radius: 12px;
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: pointer;
}

.day-num {
  font-size: 14px;
  font-weight: 600;
  z-index: 1;
}

.cell.is-selected {
  outline: 2px solid var(--primary-color);
  outline-offset: 2px;
  transform: scale(1.05);
}

.level-0 { 
  background-color: var(--bg-color); 
  color: var(--text-secondary);
  opacity: 0.5;
}
.level-1 { 
  background-color: #fff0f0; 
  color: #ff6b6b;
  border: 1px solid rgba(255, 107, 107, 0.1);
}
.level-2 { 
  background-color: #ffc9c9; 
  color: #fa5252;
}
.level-3 { 
  background-color: #ff8787; 
  color: #fff;
  box-shadow: 0 2px 8px rgba(255, 135, 135, 0.3);
}
.level-4 { 
  background-color: var(--primary-color); 
  color: #fff;
  box-shadow: 0 4px 12px rgba(255, 107, 107, 0.4);
}

.cell:hover:not(.padding) {
  transform: translateY(-2px) scale(1.1);
  box-shadow: 0 6px 16px rgba(0,0,0,0.1);
}

.day-details {
  border-top: 1px solid var(--border-color);
  padding-top: 20px;
}

.details-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.details-header h4 {
  margin: 0;
  font-size: 15px;
  font-weight: 700;
  color: var(--header-text);
}

.count-badge {
  font-size: 12px;
  background: var(--bg-color);
  padding: 2px 8px;
  border-radius: 10px;
  color: var(--text-secondary);
}

.records-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-height: 200px;
  overflow-y: auto;
  padding-right: 4px;
}

.records-list::-webkit-scrollbar {
  width: 4px;
}

.records-list::-webkit-scrollbar-thumb {
  background: var(--border-color);
  border-radius: 2px;
}

.record-item {
  background: var(--bg-color);
  padding: 12px;
  border-radius: 12px;
  border: 1px solid transparent;
  transition: border-color 0.2s;
}

.record-item:hover {
  border-color: var(--border-color);
}

.record-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
}

.round-num {
  font-size: 13px;
  font-weight: 700;
  color: var(--primary-color);
}

.record-time {
  font-size: 11px;
  color: var(--text-secondary);
  flex-grow: 1;
}

.btn-delete-mini {
  background: none;
  border: none;
  color: var(--text-secondary);
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  display: flex;
  opacity: 0;
  transition: all 0.2s;
}

.record-item:hover .btn-delete-mini {
  opacity: 1;
}

.btn-delete-mini:hover {
  background: #fee2e2;
  color: #ef4444;
}

.record-content {
  font-size: 13px;
  line-height: 1.5;
}

.record-content p {
  margin: 2px 0;
  color: var(--text-primary);
}

.record-content strong {
  color: var(--text-secondary);
  font-weight: 500;
  margin-right: 4px;
}

.empty-details {
  text-align: center;
  color: var(--text-secondary);
  font-size: 13px;
  padding: 20px;
  background: var(--bg-color);
  border-radius: 12px;
  border: 1px dashed var(--border-color);
}

@media (prefers-color-scheme: dark) {
  .history-panel {
    box-shadow: 0 4px 24px rgba(0, 0, 0, 0.2);
  }
  .datepicker-popover {
    background: #252525;
    box-shadow: 0 12px 32px rgba(0, 0, 0, 0.4);
  }
  .level-0 { background-color: #2d2d2d; opacity: 1; }
  .level-1 { background-color: #3d2b2b; color: #ff8787; border-color: rgba(255, 135, 135, 0.1); }
  .level-2 { background-color: #5c2b2b; color: #ffa8a8; }
  .level-3 { background-color: #8a3535; color: #fff; }
  .level-4 { background-color: var(--primary-color); color: #fff; }
  
  .legend, .picker-nav-btn:hover, .month-cell:hover {
    background: #1a1a1a;
  }
  
  .record-item, .empty-details {
    background: #252525;
  }
  .count-badge {
    background: #2d2d2d;
  }
}

.empty-state {
  text-align: center;
  color: var(--text-secondary);
  padding: 30px;
  font-size: 14px;
  font-style: italic;
}
</style>
