// 引入 Vue 的 ref 用于创建响应式引用
import { ref } from 'vue';
// 引入 Tauri 的 invoke 方法用于调用后端 Rust 命令
import { invoke } from "@tauri-apps/api/core";

/**
 * useHistory - 历史记录管理 Composable
 * 提供番茄钟工作记录的获取、保存和删除功能
 */
export function useHistory() {
  // 历史记录列表
  const history = ref([]);

  /**
   * 获取历史记录
   * 从后端获取所有工作记录并更新到本地
   */
  async function fetchHistory() {
    try {
      // 调用后端命令获取工作记录
      history.value = await invoke("get_work_records");
    } catch (err) {
      console.error("Failed to fetch history:", err);
    }
  }

  /**
   * 保存工作记录
   * @param {Object} record - 工作记录对象
   */
  async function saveRecord(record) {
    try {
      // 调用后端命令保存记录
      await invoke("save_work_record", { record });
      // 保存成功后刷新历史记录列表
      await fetchHistory();
    } catch (err) {
      console.error("Failed to save record:", err);
    }
  }

  /**
   * 删除工作记录
   * @param {number} id - 记录 ID
   */
  async function deleteRecord(id) {
    try {
      // 调用后端命令删除记录
      await invoke("delete_work_record", { id });
      // 删除成功后刷新历史记录列表
      await fetchHistory();
    } catch (err) {
      console.error("Failed to delete record:", err);
    }
  }

  // 导出历史记录相关状态和方法
  return {
    history,
    fetchHistory,
    saveRecord,
    deleteRecord
  };
}
