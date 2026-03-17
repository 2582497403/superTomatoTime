// 引入 Vue 的 ref 用于创建响应式引用
import { ref } from 'vue';
// 引入 Tauri 的 invoke 方法用于调用后端命令
import { invoke } from "@tauri-apps/api/core";

/**
 * useSettings - 应用设置管理 Composable
 * 提供番茄钟应用的各项配置设置，包括时间、通知、主题、音频等
 */
export function useSettings() {
  // 工作时长（分钟）
  const workDuration = ref(25);
  // 休息时长（分钟）
  const restDuration = ref(5);
  // 通知显示位置
  const notifyPosition = ref("top-center");
  // 各阶段通知文本
  const textWorkStart = ref("🍅 专注开始");
  const textWorkEnd = ref("⌛ 专注结束");
  const textRestStart = ref("☕ 休息开始");
  const textRestEnd = ref("🔔 休息结束");
  // 主题模式：system(跟随系统) | light(浅色) | dark(深色)
  const themeMode = ref("system");
  
  // ==================== 音频设置 ====================
  // 是否启用提示音
  const soundEnabled = ref(true);
  // 音量大小 (0-100)
  const soundVolume = ref(50);
  // 选择的音效类型：default|chime|digital|drop|music1-7
  const selectedSound = ref("default");

  /**
   * 保存应用设置到后端
   * @param {string} key - 设置键名
   * @param {any} value - 设置值
   */
  async function saveAppSetting(key, value) {
    try {
      // 调用后端命令保存设置
      await invoke("save_setting", { key, value });
    } catch (err) {
      console.error(`Failed to save setting ${key}:`, err);
    }
  }

  /**
   * 从后端加载应用设置
   * 批量获取所有设置项并更新到本地状态
   */
  async function loadAppSettings() {
    // 需要加载的设置键名列表
    const keys = [
      "notifyPosition", 
      "textWorkStart", 
      "textWorkEnd", 
      "textRestStart", 
      "textRestEnd",
      "workDuration",
      "restDuration",
      "themeMode",
      "soundEnabled",
      "soundVolume",
      "selectedSound"
    ];
    
    // 遍历所有设置键，逐个从后端获取
    for (const key of keys) {
      try {
        // 调用后端命令获取设置值
        const val = await invoke("get_setting", { key });
        if (val !== null) {
          // 根据键名更新对应的响应式变量
          if (key === "notifyPosition") notifyPosition.value = val;
          if (key === "textWorkStart") textWorkStart.value = val;
          if (key === "textWorkEnd") textWorkEnd.value = val;
          if (key === "textRestStart") textRestStart.value = val;
          if (key === "textRestEnd") textRestEnd.value = val;
          if (key === "workDuration") workDuration.value = parseInt(val);
          if (key === "restDuration") restDuration.value = parseInt(val);
          if (key === "themeMode") themeMode.value = val;
          // 布尔值处理：兼容字符串 'true' 和布尔值 true
          if (key === "soundEnabled") soundEnabled.value = val === 'true' || val === true;
          if (key === "soundVolume") soundVolume.value = parseInt(val);
          if (key === "selectedSound") selectedSound.value = val;
        }
      } catch (err) {
        console.error(`Failed to load setting ${key}:`, err);
      }
    }
  }

  // 导出所有设置状态和方法
  return {
    workDuration,
    restDuration,
    notifyPosition,
    textWorkStart,
    textWorkEnd,
    textRestStart,
    textRestEnd,
    themeMode,
    soundEnabled,
    soundVolume,
    selectedSound,
    saveAppSetting,
    loadAppSettings
  };
}
