// 引入 Vue 的 ref 用于创建响应式引用
import { ref } from 'vue';
// 引入 Tauri 的 invoke 方法用于调用后端命令
import { invoke } from "@tauri-apps/api/core";
// 引入 Tauri 通知插件的权限管理方法
import { isPermissionGranted, requestPermission } from '@tauri-apps/plugin-notification';

/**
 * 提醒管理 Composable
 * @returns {Object} 提醒管理相关的方法和状态
 */
export function useReminder() {
  // 存储所有提醒列表
  const reminders = ref([]);
  
  // 加载提醒列表
  async function loadReminders() {
    try {
      const list = await invoke('get_reminders');
      reminders.value = list.map(item => ({
        ...item,
        // 将后端类型转换为前端友好的格式
        type: item.reminder_type === 'interval' ? 'interval' : 'scheduled',
        value: item.type_value
      }));
    } catch (error) {
      console.error('加载提醒列表失败:', error);
      throw error;
    }
  }
  
  // 保存新提醒
  async function saveReminder(reminder) {
    try {
      const dto = {
        id: reminder.id,
        title: reminder.title,
        reminder_type: reminder.type,
        type_value: reminder.value.toString(),
        is_active: reminder.is_active !== undefined ? reminder.is_active : true
      };
      
      if (reminder.id) {
        await invoke('update_reminder', { id: reminder.id, dto });
      } else {
        await invoke('save_reminder', { dto });
      }
      
      // 重新加载列表
      await loadReminders();
    } catch (error) {
      console.error('保存提醒失败:', error);
      throw error;
    }
  }
  
  // 删除提醒
  async function deleteReminder(id) {
    try {
      await invoke('delete_reminder', { id });
      await loadReminders();
    } catch (error) {
      console.error('删除提醒失败:', error);
      throw error;
    }
  }
  
  // 切换提醒启用状态
  async function toggleReminderActive(id, isActive) {
    try {
      await invoke('toggle_reminder_active', { id, is_active: isActive });
      await loadReminders();
    } catch (error) {
      console.error('切换提醒状态失败:', error);
      throw error;
    }
  }
  
  // 触发提醒（测试用）
  async function triggerReminder(title) {
    try {
      await invoke('trigger_reminder', { title });
    } catch (error) {
      console.error('触发提醒失败:', error);
      throw error;
    }
  }
  
  // 请求通知权限
  async function requestNotificationPermission() {
    try {
      let permissionGranted = await isPermissionGranted();
      if (!permissionGranted) {
        const permission = await requestPermission();
        permissionGranted = permission === 'granted';
      }
      return permissionGranted;
    } catch (error) {
      console.error('请求通知权限失败:', error);
      return false;
    }
  }
  
  return {
    reminders,
    loadReminders,
    saveReminder,
    deleteReminder,
    triggerReminder,
    toggleReminderActive,
    requestNotificationPermission
  };
}