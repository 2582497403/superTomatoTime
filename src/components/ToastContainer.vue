<script setup>
/**
 * ToastContainer - Toast 提示容器组件
 * 显示和管理多个应用内通知提示
 */

// 定义组件 Props
const props = defineProps({
  toasts: {
    type: Array,
    required: true  // Toast 列表（必需）
  }
});

// 定义组件事件
const emit = defineEmits(['remove']); // 移除 Toast 事件

/**
 * 移除指定的 Toast
 * @param {number} id - Toast ID
 */
function removeToast(id) {
  emit('remove', id);
}
</script>

<template>
  <!-- Toast 容器：固定在页面右上角 -->
  <div class="toast-container">
    <!-- 使用 TransitionGroup 实现列表动画 -->
    <TransitionGroup name="toast">
      <div 
        v-for="toast in toasts" 
        :key="toast.id" 
        class="toast-item" 
        :class="toast.type"
        @click="removeToast(toast.id)"
      >
        <!-- Toast 图标 -->
        <div class="toast-icon">{{ toast.icon }}</div>
        <!-- Toast 内容 -->
        <div class="toast-content">
          <div class="toast-title">{{ toast.title }}</div>
          <div class="toast-body" v-if="toast.body">{{ toast.body }}</div>
        </div>
        <!-- 关闭按钮 -->
        <button class="toast-close">×</button>
      </div>
    </TransitionGroup>
  </div>
</template>

<style scoped>
.toast-container {
  position: fixed;
  top: 24px;
  right: 24px;
  z-index: 2000;
  display: flex;
  flex-direction: column;
  gap: 12px;
  pointer-events: none;
}

.toast-item {
  pointer-events: auto;
  width: 320px;
  background: var(--card-bg);
  backdrop-filter: blur(20px) saturate(180%);
  border-radius: 12px;
  padding: 12px 16px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1), 0 0 1px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: flex-start;
  gap: 12px;
  cursor: pointer;
  border: 1px solid var(--border-color);
  position: relative;
  transition: transform 0.2s, box-shadow 0.2s;
}

.toast-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 36px rgba(0, 0, 0, 0.15);
}

.toast-icon {
  font-size: 20px;
  min-width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-color);
  border-radius: 8px;
}

.toast-content {
  flex: 1;
  padding-right: 20px;
}

.toast-title {
  font-weight: 600;
  font-size: 14px;
  color: var(--text-primary);
  margin-bottom: 2px;
}

.toast-body {
  font-size: 13px;
  color: var(--text-secondary);
  line-height: 1.4;
}

.toast-close {
  position: absolute;
  top: 8px;
  right: 8px;
  background: none;
  border: none;
  color: var(--text-secondary);
  font-size: 18px;
  cursor: pointer;
  opacity: 0;
  transition: opacity 0.2s;
}

.toast-item:hover .toast-close {
  opacity: 1;
}

/* 类型样式 */
.toast-item.success { border-left: 4px solid var(--success-color); }
.toast-item.error { border-left: 4px solid var(--danger-color); }
.toast-item.warning { border-left: 4px solid #fcc419; }
.toast-item.info { border-left: 4px solid #339af0; }
.toast-item.work { border-left: 4px solid var(--primary-color); }
.toast-item.rest { border-left: 4px solid var(--success-color); }

/* 动画 */
.toast-enter-active {
  transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}
.toast-leave-active {
  transition: all 0.3s ease;
}

.toast-enter-from {
  opacity: 0;
  transform: translateX(50px) scale(0.9);
}
.toast-leave-to {
  opacity: 0;
  transform: translateX(100px);
}
</style>
