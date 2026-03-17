// 引入 Vue 的 ref 和 watch 用于创建响应式引用和监听变化
import { ref, watch } from 'vue';

// localStorage 存储键名
const STORAGE_KEY = 'reminder_todo_types';

// 默认的待办类型列表
const defaultTypes = [
  { id: '1', name: '工作', emoji: '💼' },
  { id: '2', name: '生活', emoji: '🏠' },
  { id: '3', name: '学习', emoji: '📚' }
];

/**
 * useTodoTypes - 待办类型管理 Composable
 * 提供待办事项类型的增删改查功能，数据持久化到 localStorage
 */

// 待办类型列表（全局共享状态）
const todoTypes = ref([]);

// 从 localStorage 加载保存的类型
const savedTypes = localStorage.getItem(STORAGE_KEY);
if (savedTypes) {
  try {
    // 尝试解析 JSON
    todoTypes.value = JSON.parse(savedTypes);
  } catch (e) {
    console.error('Failed to parse todo types from localStorage', e);
    // 解析失败则使用默认类型
    todoTypes.value = [...defaultTypes];
  }
} else {
  // 没有保存数据则使用默认类型
  todoTypes.value = [...defaultTypes];
}

// 监听类型变化并自动保存到 localStorage
watch(todoTypes, (newVal) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(newVal));
}, { deep: true }); // 深度监听数组内对象的变化

export function useTodoTypes() {
  /**
   * 添加新的待办类型
   * @param {string} name - 类型名称
   * @param {string} emoji - 类型图标
   */
  const addType = (name, emoji) => {
    if (!name.trim()) return; // 空名称不添加
    todoTypes.value.push({
      id: Date.now().toString(), // 使用时间戳作为唯一 ID
      name: name.trim(),
      emoji: emoji || '📝' // 默认使用📝图标
    });
  };

  /**
   * 更新现有类型
   * @param {string} id - 类型 ID
   * @param {string} name - 新名称
   * @param {string} emoji - 新图标
   */
  const updateType = (id, name, emoji) => {
    const type = todoTypes.value.find(t => t.id === id);
    if (type) {
      type.name = name.trim();
      type.emoji = emoji;
    }
  };

  /**
   * 删除指定类型
   * @param {string} id - 类型 ID
   */
  const removeType = (id) => {
    todoTypes.value = todoTypes.value.filter(t => t.id !== id);
  };

  /**
   * 根据 ID 获取类型
   * @param {string} id - 类型 ID
   * @returns {Object|undefined} 类型对象或 undefined
   */
  const getTypeById = (id) => {
    return todoTypes.value.find(t => t.id === id);
  };

  // 导出类型列表和相关方法
  return {
    todoTypes,
    addType,
    updateType,
    removeType,
    getTypeById
  };
}
