<script setup>
// 引入 Vue 3 的响应式 API
import { ref, onMounted, watch } from "vue";
// 引入 Tauri 的 invoke 方法用于调用 Rust 后端命令
import { invoke } from "@tauri-apps/api/core";
// 引入各个功能的 composable 函数
import { useSettings } from "./composables/useSettings";      // 应用设置管理
import { useNotifications } from "./composables/useNotifications"; // 通知提醒管理
import { useHistory } from "./composables/useHistory";       // 历史记录管理
import { useTimer } from "./composables/useTimer";           // 番茄计时器管理
import { useAudio } from "./composables/useAudio";           // 音频播放管理
import { useTodos } from "./composables/useTodos";           // 待办事项管理
import { computed } from "vue";

// 引入 UI 组件
import SettingsPanel from "./components/SettingsPanel.vue";        // 设置面板
import HistoryPanel from "./components/HistoryPanel.vue";          // 番茄历史面板
import TodoHistoryPanel from "./components/todo/TodoHistoryPanel.vue"; // 待办历史面板
import TimerPanel from "./components/TimerPanel.vue";              // 计时器面板
import TodoList from "./components/todo/TodoList.vue";             // 待办列表
import ToastContainer from "./components/ToastContainer.vue";      // Toast 提示容器
import CompletionModal from "./components/todo/CompletionModal.vue"; // 完成确认弹窗
import Reminder from "./components/reminder/Reminder.vue"; // 消息提醒组件（占位）
// ==================== 初始化各个 Composable ====================
// --- 设置相关 ---
const { 
  workDuration, restDuration, notifyPosition,   // 工作时长、休息时长、通知位置
  textWorkStart, textWorkEnd, textRestStart, textRestEnd, // 各阶段通知文本
  themeMode,                                     // 主题模式（system/light/dark）
  soundEnabled, soundVolume, selectedSound,      // 音频设置：是否启用、音量、音效类型
  saveAppSetting, loadAppSettings                // 保存和加载设置的方法
} = useSettings();

// 主题管理：根据主题模式应用相应的 CSS 类
const applyTheme = (mode) => {
  const root = document.documentElement;
  
  // 移除所有手动添加的主题类
  root.classList.remove('light-theme', 'dark-theme');
  
  if (mode === 'system') {
    // 跟随系统：利用 CSS media query，移除手动强制的类即可，CSS 会自动 fallback 到 prefers-color-scheme
  } else if (mode === 'light') {
    root.classList.add('light-theme');
  } else if (mode === 'dark') {
    root.classList.add('dark-theme');
  }
};

// 监听主题模式变化并应用新主题
watch(themeMode, (newVal) => {
  applyTheme(newVal);
});

// --- 通知相关 ---
const { 
  toasts, removeToast, ensureNotificationPermission, notify // Toast 列表、移除 Toast、获取通知权限、发送通知
} = useNotifications();

// --- 历史记录相关 ---
const { 
  history, fetchHistory, saveRecord, deleteRecord // 历史记录列表、获取记录、保存记录、删除记录
} = useHistory();

// --- 音频相关 ---
const { playSound } = useAudio(); // 播放提示音

// ==================== 番茄钟回调函数 ====================
// 专注开始时的回调：发送通知
const onStartWork = (round, duration) => {
  notify(textWorkStart.value, `第 ${round} 轮番茄启动，专注 ${duration} 分钟`, notifyPosition.value, 'work');
};

// 专注结束时的回调：播放声音 + 发送成功通知
const onEndWork = () => {
  playSound(soundEnabled.value, soundVolume.value, selectedSound.value);
  notify(textWorkEnd.value, "一个番茄钟完成！请填写总结并开始休息。", notifyPosition.value, 'success');
};

// 休息开始时的回调：发送通知并保存工作记录
const onStartRest = async (duration, record) => {
  notify(textRestStart.value, `休息时间开始，持续 ${duration} 分钟`, notifyPosition.value, 'rest');
  await saveRecord(record);
};

// 休息结束时的回调：播放声音 + 发送通知
const onEndRest = () => {
  playSound(soundEnabled.value, soundVolume.value, selectedSound.value);
  notify(textRestEnd.value, "休息结束，准备开始下一个番茄吗？", notifyPosition.value, 'timer');
};

// --- 计时器相关 ---
const {
  currentRound, timerState, timeLeft, progress, formattedTime, startTime, // 当前轮次、状态、剩余时间、进度、格式化时间、开始时间
  workPlan, workSummary, startRound, startRest, resetAll // 工作计划、工作总结、开始轮次、开始休息、重置所有
} = useTimer(workDuration, restDuration, onEndWork, onEndRest, onStartWork, onStartRest);

// ==================== 待办事项集成 ====================
const { todos, incrementPomodoro, toggleTodo } = useTodos(); // 待办列表、增加番茄数、切换完成状态

// 自定义计划标记
const isCustomPlan = ref(false);
// 选中的待办 ID（用于 TimerPanel）
const selectedTodoId = ref(null);
// 弹窗中待办的 ID（用于 CompletionModal）
const modalTodoId = ref(null);
// 是否显示完成确认弹窗
const showCompletionModal = ref(false);
// 完成来源：'timer'(计时器完成) | 'list'(列表手动完成)
const completionSource = ref('timer');

// 计算属性：未完成的待办列表
const incompleteTodos = computed(() => todos.value.filter(t => !t.completed));
// 计算属性：弹窗中要显示的待办
const modalTodo = computed(() => todos.value.find(t => t.id === modalTodoId.value));

// 监听番茄钟完成事件：当专注时间结束时自动触发
watch([timerState, timeLeft], ([newState, newTime]) => {
  if (newState === 'working' && newTime === 0) {
    // 专注结束
    if (selectedTodoId.value) {
      incrementPomodoro(selectedTodoId.value); // 为选中的待办增加一个番茄
      modalTodoId.value = selectedTodoId.value; // 设置弹窗待办 ID
      completionSource.value = 'timer'; // 标记来源为计时器
      showCompletionModal.value = true; // 显示完成确认弹窗
    }
  }
});

// 处理待办列表中的完成请求（用户手动点击完成）
const handleListRequestComplete = (todo) => {
  modalTodoId.value = todo.id;
  completionSource.value = 'list';
  showCompletionModal.value = true;
};

// 处理完成确认（用户填写评分和评论后）
const handleCompletionConfirm = async ({ todoId, rating, comment }) => {
  // 更新待办完成状态
  toggleTodo(todoId, rating, comment);
  
  if (completionSource.value === 'timer') {
    // 如果是从计时器触发的完成，需要手动保存记录（因为跳过了正常的 rest 流程）
    const record = {
      round_number: currentRound.value,
      work_start_time: startTime.value, 
      work_duration_minutes: workDuration.value,
      work_plan: workPlan.value,
      work_summary: workSummary.value || `任务完成：${todos.value.find(t => t.id === todoId)?.text} (评分：${rating}★)`,
      rest_start_time: new Date().toLocaleString(),
      rest_duration_minutes: 0,
    };
    await saveRecord(record);
    resetAll(); // 关闭番茄钟
    selectedTodoId.value = null; // 清空选中的待办
  }
  
  showCompletionModal.value = false;
  modalTodoId.value = null;
};

// 处理完成取消（用户关闭弹窗）
const handleCompletionCancel = () => {
  showCompletionModal.value = false;
  modalTodoId.value = null;
  
  if (completionSource.value === 'timer') {
    // 如果是从计时器完成触发的，关闭弹窗后让用户继续手动操作
    // 或者不做任何操作，用户仍然处于 'working' 状态且时间为 0
    // 他们可以手动点击 "开始休息"
  }
};


// ==================== 应用状态定义 ====================
// 是否显示设置面板
const showSettings = ref(false);
// 是否窗口置顶
const isAlwaysOnTop = ref(false);
// 当前视图：'timer'(番茄钟) | 'todo'(待办) | 'history'(历史) | 'todo-history'(待办历史)
const currentView = ref('timer');

// 切换窗口置顶状态
const toggleAlwaysOnTop = async () => {
  try {
    isAlwaysOnTop.value = !isAlwaysOnTop.value;
    await invoke("set_always_on_top", { onTop: isAlwaysOnTop.value });
  } catch (err) {
    console.error("Failed to set always on top:", err);
    isAlwaysOnTop.value = !isAlwaysOnTop.value; // 失败时恢复原状态
  }
};

// 应用挂载时的初始化操作
onMounted(async () => {
  await loadAppSettings();      // 加载用户设置
  applyTheme(themeMode.value);  // 应用主题
  fetchHistory();               // 获取历史记录
  ensureNotificationPermission(); // 请求通知权限
});
</script>

<template>
  <!-- 主程序窗口容器 -->
  <main class="container">
    <!-- 顶部标题栏（支持拖拽） -->
    <div class="header" data-tauri-drag-region>
      <div class="header-main" data-tauri-drag-region>
        <h1 data-tauri-drag-region>{{currentView === 'timer' ? '番茄钟' : currentView === 'reminder' ? '提醒' : currentView === 'todo' ? '今日待办' : '历史'}}</h1>
        
        <!-- 导航标签页 -->
        <div class="nav-tabs">
          <button 
            class="nav-tab" 
            :class="{ active: currentView === 'timer' }"
            @click="currentView = 'timer'"
          >
            番茄钟
          </button>
          <button
            class="nav-tab" 
            :class="{ active: currentView === 'reminder' }"
            @click="currentView = 'reminder'">
            提醒
          </button>
          <button 
            class="nav-tab" 
            :class="{ active: currentView === 'todo' }"
            @click="currentView = 'todo'"
          >
            今日待办
          </button>
          <button 
            class="nav-tab" 
            :class="{ active: currentView === 'history' || currentView === 'todo-history' }"
            @click="currentView = 'history'"
          >
            历史
          </button>
        </div>

        <!-- 头部操作按钮 -->
        <div class="header-actions">
          <!-- 窗口置顶按钮 -->
          <button 
            class="btn-icon" 
            :class="{ active: isAlwaysOnTop }" 
            @click="toggleAlwaysOnTop"
            :title="isAlwaysOnTop ? '取消置顶' : '窗口置顶'"
          >
            <svg viewBox="0 0 24 24" width="18" height="18">
              <path fill="currentColor" d="M16,12V4H17V2H7V4H8V12L6,14V16H11.2V22H12.8V16H18V14L16,12M8.8,14L10,12.8V4H14V12.8L15.2,14H8.8Z" />
            </svg>
          </button>
          <!-- 设置按钮 -->
          <button class="btn-icon" @click="showSettings = !showSettings" title="设置">⚙️</button>
        </div>
      </div>
    </div>

    <!-- ==================== 各功能区域 ==================== -->
    <!-- 设置面板 -->
    <SettingsPanel 
      :show="showSettings"
      v-model:notifyPosition="notifyPosition"
      v-model:textWorkStart="textWorkStart"
      v-model:textWorkEnd="textWorkEnd"
      v-model:textRestStart="textRestStart"
      v-model:textRestEnd="textRestEnd"
      v-model:themeMode="themeMode"
      v-model:soundEnabled="soundEnabled"
      v-model:soundVolume="soundVolume"
      v-model:selectedSound="selectedSound"
      @close="showSettings = false"
      @save="saveAppSetting"
    />

    <!-- 应用内 Toast 提示容器 -->
    <ToastContainer :toasts="toasts" @remove="removeToast" />

    <!-- 待办完成确认弹窗 -->
    <CompletionModal 
      :show="showCompletionModal" 
      :todo="modalTodo" 
      @confirm="handleCompletionConfirm"
      @close="handleCompletionCancel"
    />

    <!-- 番茄钟视图 -->
    <div v-if="currentView === 'timer'">
      <TimerPanel 
        v-model:workDuration="workDuration"
        v-model:restDuration="restDuration"
        v-model:workPlan="workPlan"
        v-model:workSummary="workSummary"
        v-model:isCustomPlan="isCustomPlan"
        v-model:selectedTodoId="selectedTodoId"
        :incompleteTodos="incompleteTodos"
        :timerState="timerState"
        :timeLeft="timeLeft"
        :formattedTime="formattedTime"
        :progress="progress"
        @startRound="startRound"
        @startRest="startRest"
        @resetAll="resetAll"
        @switchView="(view) => currentView = view"
      />
    </div>

    <div v-else-if="currentView === 'reminder'">
      <Reminder />
    </div>

    <!-- 待办事项列表视图 -->
    <div v-else-if="currentView === 'todo'">
      <TodoList @request-complete="handleListRequestComplete" />
    </div>

    <!-- 番茄历史记录视图 -->
    <div v-else-if="currentView === 'history'">
      <div class="history-view-switcher">
        <button class="icon-btn-large" @click="currentView = 'todo-history'" title="切换到待办历史">
          📝 待办历史 >
        </button>
      </div>
      <HistoryPanel :history="history" @delete="deleteRecord" />
    </div>

    <!-- 待办历史视图 -->
    <div v-else-if="currentView === 'todo-history'">
      <div class="history-view-switcher">
        <button class="icon-btn-large" @click="currentView = 'history'" title="切换到番茄历史">
          🍅 番茄历史 >
        </button>
      </div>
      <TodoHistoryPanel />
    </div>
  </main>
</template>

<style>
/* ... existing styles ... */

.history-view-switcher {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 12px;
}

.icon-btn-large {
  background: var(--card-bg);
  border: 1px solid var(--border-color);
  padding: 8px 16px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  color: var(--text-primary);
  display: flex;
  align-items: center;
  gap: 6px;
  transition: all 0.2s;
  box-shadow: 0 2px 8px rgba(0,0,0,0.04);
}

.icon-btn-large:hover {
  background: var(--bg-color);
  border-color: var(--primary-color);
  color: var(--primary-color);
}

:root {
  --primary-color: #ff6b6b; /* 番茄色 */
  --success-color: #51cf66;
  --danger-color: #fa5252;
  --bg-color: #f8f9fa;
  --card-bg: #ffffff;
  --text-primary: #212529;
  --text-secondary: #868e96;
  --border-radius: 16px;
  --border-color: rgba(0, 0, 0, 0.05);
  --input-bg: #ffffff;
  --input-border: #ddd;
  --header-text: #1d1d1f;
}

:root.light-theme {
  --bg-color: #f8f9fa;
  --card-bg: #ffffff;
  --text-primary: #212529;
  --text-secondary: #868e96;
  --border-color: rgba(0, 0, 0, 0.05);
  --input-bg: #ffffff;
  --input-border: #ddd;
  --header-text: #1d1d1f;
}

:root.dark-theme {
  --bg-color: #1a1a1a;
  --card-bg: #2d2d2d;
  --text-primary: #e0e0e0;
  --text-secondary: #a0a0a0;
  --border-color: rgba(255, 255, 255, 0.1);
  --input-bg: #3d3d3d;
  --input-border: #4a4a4a;
  --header-text: #ffffff;
}

@media (prefers-color-scheme: dark) {
  :root {
    --bg-color: #1a1a1a;
    --card-bg: #2d2d2d;
    --text-primary: #e0e0e0;
    --text-secondary: #a0a0a0;
    --border-color: rgba(255, 255, 255, 0.1);
    --input-bg: #3d3d3d;
    --input-border: #4a4a4a;
    --header-text: #ffffff;
  }
}

body {
  margin: 0;
  background-color: var(--bg-color);
  color: var(--text-primary);
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", sans-serif;
  overflow-x: hidden;
}

/* 确保通知窗口背景完全透明 */
body:has(.sys-notification-window) {
  background-color: transparent !important;
}

/* 通知窗口专用：强制 html, body 透明 */
body.is-notification,
body.is-notification #app {
  background: transparent !important;
  margin: 0;
  padding: 0;
  overflow: hidden;
}

.header-main {
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: relative;
}

.nav-tabs {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  background: var(--input-bg);
  padding: 4px;
  border-radius: 12px;
  border: 1px solid var(--border-color);
}

.nav-tab {
  background: none;
  border: none;
  padding: 6px 16px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.2s;
}

.nav-tab:hover {
  color: var(--text-primary);
}

.nav-tab.active {
  background: var(--card-bg);
  color: var(--text-primary);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.header-actions {
  display: flex;
  gap: 8px;
  align-items: center;
}

.btn-icon {
  background: none;
  border: none;
  font-size: 20px;
  cursor: pointer;
  padding: 6px;
  border-radius: 8px;
  transition: all 0.2s;
  color: var(--text-secondary);
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn-icon:hover {
  background: var(--border-color);
  color: var(--text-primary);
}

.btn-icon.active {
  color: var(--primary-color);
  background: rgba(255, 107, 107, 0.1);
}

.container {
  max-width: 600px;
  margin: 0 auto;
  padding: 40px 20px;
}

.header {
  margin-bottom: 20px;
}

.header h1 {
  font-size: 28px;
  font-weight: 700;
  color: var(--header-text);
  margin: 0;
}

.subtitle {
  text-align: center;
  color: var(--text-secondary);
  margin-top: 8px;
}

.card {
  background: var(--card-bg);
  border-radius: var(--border-radius);
  padding: 24px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.04);
  margin-bottom: 24px;
  border: 1px solid var(--border-color);
}

.btn-primary {
  background-color: var(--primary-color);
  color: white;
  border: none;
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

.btn-primary:hover, .btn-success:hover, .btn-danger:hover {
  opacity: 0.9;
}
</style>
