<script setup>
/**
 * BaseModal - 基础弹窗组件
 * 提供通用的模态框容器，支持标题、内容插槽和底部插槽
 */

// 定义组件 Props
defineProps({
  show: Boolean,   // 是否显示弹窗
  title: String    // 弹窗标题
});

// 定义组件事件
const emit = defineEmits(['close']); // 关闭事件
</script>

<template>
  <!-- 使用 Transition 实现进入/离开动画 -->
  <Transition name="modal">
    <div v-if="show" class="modal-backdrop" @click.self="emit('close')">
      <div class="modal-container">
        <!-- 弹窗头部：标题和关闭按钮 -->
        <div class="modal-header">
          <h3>{{ title }}</h3>
          <button class="btn-close" @click="emit('close')">×</button>
        </div>
        <!-- 弹窗主体内容（插槽） -->
        <div class="modal-body">
          <slot></slot>
        </div>
        <!-- 弹窗底部（可选插槽） -->
        <div class="modal-footer" v-if="$slots.footer">
          <slot name="footer"></slot>
        </div>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.modal-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(4px);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-container {
  background: var(--card-bg);
  width: 90%;
  max-width: 500px;
  border-radius: var(--border-radius);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
  border: 1px solid var(--border-color);
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.modal-header {
  padding: 16px 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid var(--border-color);
}

.modal-header h3 {
  margin: 0;
  font-size: 18px;
  color: var(--header-text);
}

.btn-close {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: var(--text-secondary);
  line-height: 1;
  padding: 4px;
  border-radius: 50%;
  transition: background 0.2s;
}

.btn-close:hover {
  background: var(--border-color);
}

.modal-body {
  padding: 24px;
  max-height: 70vh;
  overflow-y: auto;
}

.modal-footer {
  padding: 16px 24px;
  border-top: 1px solid var(--border-color);
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

/* 动画 */
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-active .modal-container,
.modal-leave-active .modal-container {
  transition: transform 0.3s ease;
}

.modal-enter-from .modal-container {
  transform: scale(0.9);
}

.modal-leave-to .modal-container {
  transform: scale(0.9);
}
</style>
