// 引入 Vue 的 ref 用于创建响应式引用
import { ref } from 'vue';
// 引入 Tauri 的 invoke 方法用于调用后端命令
import { invoke } from "@tauri-apps/api/core";
// 引入 Tauri 通知插件的权限管理方法
import { isPermissionGranted, requestPermission } from '@tauri-apps/plugin-notification';

/**
 * useNotifications - 通知管理 Composable
 * 提供系统通知和应用内 Toast 提示功能
 */
export function useNotifications() {
  // Toast 提示列表
  const toasts = ref([]);
  // 系统通知显示位置
  const notifyPosition = ref("top-center");

  /**
   * 显示应用内 Toast 提示
   * @param {string} title - 标题
   * @param {string} body - 内容
   * @param {string} type - 类型：success|info|error|warning|timer|work|rest
   */
  function showToast(title, body, type = 'info') {
    const id = Date.now();
    // 不同类型对应的图标
    const icons = {
      success: '✅',
      info: 'ℹ️',
      error: '❌',
      warning: '⚠️',
      timer: '⏱️',
      work: '🍅',
      rest: '☕'
    };
  
    // 添加到 Toast 列表
    toasts.value.push({ 
      id, 
      title, 
      body, 
      type,
      icon: icons[type] || '🔔'
    });
      
    // 5 秒后自动移除该 Toast
    setTimeout(() => {
      removeToast(id);
    }, 5000);
  }
  
  /**
   * 移除指定的 Toast
   * @param {number} id - Toast ID
   */
  function removeToast(id) {
    toasts.value = toasts.value.filter(t => t.id !== id);
  }

  /**
   * 获取并请求系统通知权限
   * @returns {Promise<boolean>} 是否有通知权限
   */
  async function ensureNotificationPermission() {
    // 检查当前权限状态
    let permission = await isPermissionGranted();
    if (!permission) {
      // 如果没有权限，则请求权限
      permission = await requestPermission();
    }
    return permission;
  }

  /**
   * 发送系统通知（失败时降级为应用内 Toast）
   * @param {string} title - 通知标题
   * @param {string} body - 通知内容
   * @param {string} position - 通知显示位置
   * @param {string} type - 通知类型
   */
  function notify(title, body, position, type = 'info') {
    // 调用后端命令显示系统通知
    invoke("show_mac_notification", { title, body, position: position || notifyPosition.value }).catch(err => {
      console.error("Failed to show system notification:", err);
      // 如果系统通知失败，降级使用应用内 Toast
      showToast(title, body, type);
    });
  }

  // 导出通知相关状态和方法
  return {
    toasts,
    notifyPosition,
    showToast,
    removeToast,
    ensureNotificationPermission,
    notify
  };
}
