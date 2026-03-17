<script setup>
/**
 * TimerPanel - 番茄钟计时器面板组件
 * 提供番茄钟的配置、倒计时显示、休息控制等功能
 * 支持选择待办事项或自定义计划模式
 */

import { onMounted, watch, computed } from 'vue';
import { useTodoTypes } from '../composables/useTodoTypes';
import TypeBadge from './todo/TypeBadge.vue';

// ==================== Props 定义 ====================
const props = defineProps({
  timerState: String,        // 计时器状态：'idle'|'working'|'resting'
  timeLeft: Number,          // 剩余时间（秒）
  formattedTime: String,     // 格式化后的时间显示
  progress: Number,          // 进度百分比
  workDuration: Number,      // 工作时长（分钟）
  restDuration: Number,      // 休息时长（分钟）
  workPlan: String,          // 工作计划/任务描述
  workSummary: String,       // 工作总结
  isCustomPlan: Boolean,     // 是否为自定义计划模式
  selectedTodoId: Number,    // 选中的待办 ID
  incompleteTodos: {         // 未完成的待办列表
    type: Array,
    default: () => []
  }
});

// ==================== Events 定义 ====================
const emit = defineEmits([
  'update:workDuration',      // 更新工作时长
  'update:restDuration',      // 更新休息时长
  'update:workPlan',          // 更新工作计划
  'update:workSummary',       // 更新工作总结
  'update:isCustomPlan',      // 更新计划模式
  'update:selectedTodoId',    // 更新选中的待办 ID
  'startRound',               // 开始新一轮番茄
  'startRest',                // 开始休息
  'resetAll',                 // 重置所有状态
  'switchView'                // 切换视图
]);

// 引入待办类型管理工具
const { getTypeById } = useTodoTypes();

/**
 * 计算属性：获取选中待办的类型
 * @returns {Object|null} 待办类型对象或 null
 */
const selectedTodoType = computed(() => {
  if (props.selectedTodoId) {
    // 查找选中的待办
    const todo = props.incompleteTodos.find(t => t.id === props.selectedTodoId);
    if (todo && todo.typeId) {
      // 返回待办类型
      return getTypeById(todo.typeId);
    }
  }
  return null;
});

/**
 * 更新工作时长
 * @param {Event} val - 输入事件值
 */
function updateWorkDuration(val) {
  emit('update:workDuration', parseInt(val));
}

/**
 * 更新休息时长
 * @param {Event} val - 输入事件值
 */
function updateRestDuration(val) {
  emit('update:restDuration', parseInt(val));
}

/**
 * 切换计划模式（自定义计划 vs 选择待办）
 */
function togglePlanMode() {
  const newMode = !props.isCustomPlan;
  emit('update:isCustomPlan', newMode);
  
  if (newMode) {
    // 切换到自定义计划模式：清空待办选择和计划
    emit('update:selectedTodoId', null);
    emit('update:workPlan', '');
  } else {
    // 切换到待办选择模式：自动选择第一个待办
    if (props.incompleteTodos.length > 0) {
      const first = props.incompleteTodos[0];
      emit('update:selectedTodoId', first.id);
      emit('update:workPlan', first.text);
    } else {
      // 没有待办时清空
      emit('update:selectedTodoId', null);
      emit('update:workPlan', '');
    }
  }
}

/**
 * 处理待办选择事件
 * @param {Event} e - 选择框变化事件
 */
function handleTodoSelect(e) {
  const id = Number(e.target.value);
  emit('update:selectedTodoId', id);
  const todo = props.incompleteTodos.find(t => t.id === id);
  if (todo) {
    // 同步更新计划内容为选中的待办文本
    emit('update:workPlan', todo.text);
  }
}

/**
 * 处理开始休息逻辑
 * 如果有选中的待办，自动填充总结内容
 */
function handleStartRest() {
  if (props.selectedTodoId) {
    // 如果是待办任务，且还没有总结，则自动填充
    if (!props.workSummary) {
      emit('update:workSummary', `专注任务：${props.workPlan}`);
    }
  }
  emit('startRest');
}

// ==================== 监听器 ====================
// 监听未完成待办列表变化，自动选择第一个待办（当当前选择无效时）
watch(() => props.incompleteTodos, (newTodos) => {
  // 如果不是自定义计划模式、没有选中待办、且有新待办时
  if (!props.isCustomPlan && !props.selectedTodoId && newTodos.length > 0) {
    const first = newTodos[0];
    emit('update:selectedTodoId', first.id);
    emit('update:workPlan', first.text);
  }
}, { immediate: true }); // 立即执行一次
</script>

<template>
  <div>
    <!-- ==================== 配置与控制区（空闲状态） ==================== -->
    <div v-if="timerState === 'idle'" class="config-panel card">
      <!-- 时间配置行 -->
      <div class="input-row">
        <div class="input-group">
          <label>专注 (分钟)</label>
          <input 
            type="number" 
            :value="workDuration" 
            @input="e => updateWorkDuration(e.target.value)" 
            min="1" 
          />
        </div>
        <div class="input-group">
          <label>休息 (分钟)</label>
          <input 
            type="number" 
            :value="restDuration" 
            @input="e => updateRestDuration(e.target.value)" 
            min="1" 
          />
        </div>
      </div>
      
      <!-- 计划输入区域（开始前显示） -->
      <div class="plan-section-idle">
        <div class="plan-header">
          <!-- 根据模式显示不同标题 -->
          <label>{{ isCustomPlan ? '本轮专注计划' : '选择今日待办' }}</label>
          <!-- 模式切换按钮 -->
          <button 
            class="icon-btn" 
            @click="togglePlanMode" 
            :title="isCustomPlan ? '切换到待办选择' : '切换到自定义计划'"
          >
            {{ isCustomPlan ? '📋' : '✏️' }}
          </button>
        </div>
        
        <!-- 待办选择模式 -->
        <div v-if="!isCustomPlan" class="todo-select-container">
          <!-- 显示选中的待办类型徽章 -->
          <div v-if="selectedTodoType" class="selected-type-badge">
            <TypeBadge :type="selectedTodoType" />
          </div>
          <!-- 待办下拉选择框 -->
          <select 
            v-if="incompleteTodos.length > 0"
            :value="selectedTodoId" 
            @change="handleTodoSelect"
            class="todo-select"
            :class="{ 'with-type': selectedTodoType }"
          >
            <option v-for="todo in incompleteTodos" :key="todo.id" :value="todo.id">
              {{ todo.text }}
            </option>
          </select>
          <!-- 没有待办时的提示 -->
          <div v-else class="no-todos">
            没有待办事项，<a href="#" @click.prevent="$emit('switchView', 'todo')">去添加</a> 或切换到自定义计划。
          </div>
        </div>

        <!-- 自定义计划模式：文本域输入 -->
        <textarea 
          v-else
          :value="workPlan" 
          @input="e => emit('update:workPlan', e.target.value)" 
          placeholder="专注..."
        ></textarea>
      </div>
      
      <!-- 开始按钮 -->
      <button class="btn-primary" @click="emit('startRound')">开始番茄</button>
    </div>

    <!-- ==================== 计时器显示（工作/休息状态） ==================== -->
    <div v-else class="timer-panel card">
      <!-- 状态徽章 -->
      <div class="status-badge" :class="timerState">
        {{ timerState === 'working' ? '🚀 正在专注中' : '☕ 正在休息中' }}
      </div>
      
      <!-- 倒计时数字显示 -->
      <div class="timer-display">
        {{ formattedTime }}
      </div>

      <!-- 进度条 -->
      <div class="progress-container">
        <div class="progress-bar" :style="{ width: progress + '%' }"></div>
      </div>

      <!-- 工作计划显示（工作中显示） -->
      <div v-if="timerState === 'working' && workPlan" class="plan-display">
        <span class="plan-label">当前任务:</span>
        <div class="plan-content">
          <TypeBadge v-if="selectedTodoType" :type="selectedTodoType" />
          <p class="plan-text">{{ workPlan }}</p>
        </div>
      </div>

      <!-- 总结输入区域（专注结束、休息前显示） -->
      <div v-if="timerState === 'working' && timeLeft === 0" class="summary-section">
        <label>番茄总结</label>
        <!-- 如果有选中的待办，自动使用待办标题，只显示不编辑 -->
        <div v-if="selectedTodoId" class="summary-text">
          <div class="summary-content">
            <TypeBadge v-if="selectedTodoType" :type="selectedTodoType" />
            <p>任务：{{ workPlan }}</p>
          </div>
        </div>
        <!-- 自定义计划模式：显示输入框 -->
        <textarea 
          v-else
          :value="workSummary" 
          @input="e => emit('update:workSummary', e.target.value)" 
          placeholder="刚才专注了什么？"
        ></textarea>
        <button class="btn-success" @click="handleStartRest">保存并开始休息</button>
      </div>

      <!-- 休息中显示 -->
      <div v-if="timerState === 'resting'" class="rest-section">
        <p>好好休息，恢复精力...</p>
        <button v-if="timeLeft === 0" class="btn-primary" @click="emit('startRound')">开始下一个番茄</button>
      </div>

      <!-- 重置按钮 -->
      <button class="btn-danger btn-small" @click="emit('resetAll')">重置</button>
    </div>
  </div>
</template>

<style scoped>
.config-panel, .timer-panel {
  text-align: center;
}

.mode-selector {
  display: flex;
  background: var(--bg-color);
  padding: 4px;
  border-radius: 10px;
  margin-bottom: 20px;
}

.mode-selector span {
  flex: 1;
  padding: 8px;
  text-align: center;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  border-radius: 8px;
  transition: all 0.2s;
  color: var(--text-secondary);
}

.mode-selector span.active {
  background: var(--card-bg);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  color: var(--text-primary);
}

.input-row {
  display: flex;
  gap: 16px;
  margin-bottom: 20px;
}

.input-group {
  flex: 1;
  text-align: left;
}

.input-group label {
  font-size: 14px;
  color: var(--text-secondary);
  display: block;
  margin-bottom: 4px;
}

input[type="number"], textarea {
  width: 100%;
  box-sizing: border-box;
  padding: 10px;
  border: 1px solid var(--input-border);
  border-radius: 8px;
  font-size: 16px;
  background: var(--input-bg);
  color: var(--text-primary);
}

textarea {
  min-height: 80px;
  resize: vertical;
}

.btn-primary {
  background-color: var(--primary-color);
  color: white;
  border: none;
  width: 100%;
  padding: 12px;
  border-radius: 8px;
  font-size: 16px;
  cursor: pointer;
  transition: opacity 0.2s;
}

.btn-success {
  background-color: var(--success-color);
  color: white;
  border: none;
  padding: 12px;
  border-radius: 8px;
  font-size: 16px;
  cursor: pointer;
}

.btn-danger {
  background-color: var(--danger-color);
  color: white;
  border: none;
  padding: 8px;
  border-radius: 8px;
  cursor: pointer;
}

.btn-small {
  font-size: 12px;
  margin-top: 15px;
}

.status-badge {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: bold;
  margin-bottom: 15px;
}

.plan-section-idle {
  text-align: left;
  margin-bottom: 20px;
}

.plan-section-idle label {
  font-size: 14px;
  color: var(--text-secondary);
  margin-bottom: 0;
}

.plan-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.icon-btn {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 16px;
  padding: 4px;
  border-radius: 4px;
  transition: background 0.2s;
}

.icon-btn:hover {
  background: var(--border-color);
}

.todo-select-container {
  position: relative;
  display: flex;
  align-items: center;
}

.selected-type-badge {
  position: absolute;
  left: 10px;
  z-index: 1;
  pointer-events: none; /* Let clicks pass through to select */
}

.todo-select {
  width: 100%;
  padding: 10px;
  border: 1px solid var(--input-border);
  border-radius: 8px;
  font-size: 16px;
  background: var(--input-bg);
  color: var(--text-primary);
  appearance: none; /* Custom styling usually requires removing default appearance */
  background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e");
  background-repeat: no-repeat;
  background-position: right 10px center;
  background-size: 16px;
}

.todo-select.with-type {
  padding-left: 36px;
}

.no-todos {
  padding: 12px;
  text-align: center;
  color: var(--text-secondary);
  font-size: 14px;
  background: var(--bg-color);
  border-radius: 8px;
  width: 100%;
}

.plan-display {
  margin: 15px 0;
  padding: 12px;
  background: var(--bg-color);
  border-radius: 10px;
  text-align: left;
}

.plan-content, .summary-content {
  display: flex;
  align-items: center;
  gap: 8px;
}

.plan-label {
  font-size: 12px;
  color: var(--text-secondary);
  font-weight: 600;
  display: block;
  margin-bottom: 4px;
}

.plan-text {
  margin: 0;
  font-size: 15px;
  color: var(--text-primary);
  line-height: 1.5;
}

.summary-section {
  text-align: left;
  margin-top: 20px;
  padding: 15px;
  background: var(--bg-color);
  border-radius: 12px;
  border: 1px dashed var(--primary-color);
}

.summary-section label {
  font-size: 14px;
  color: var(--primary-color);
  font-weight: 600;
  display: block;
  margin-bottom: 8px;
}

.summary-section textarea {
  margin-bottom: 12px;
  border-color: rgba(255, 107, 107, 0.2);
}

.summary-section .btn-success {
  width: 100%;
}

.status-badge.working {
  background-color: #fff5f5;
  color: var(--primary-color);
}

.status-badge.resting {
  background-color: #f4fce3;
  color: var(--success-color);
}

.timer-display {
  font-size: 64px;
  font-weight: bold;
  font-family: monospace;
  margin-bottom: 20px;
}

.progress-container {
  height: 8px;
  background-color: #f0f0f0;
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 25px;
}

.progress-bar {
  height: 100%;
  background-color: var(--primary-color);
  transition: width 1s linear;
}
</style>
