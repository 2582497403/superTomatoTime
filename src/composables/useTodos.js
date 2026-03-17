// 引入 Vue 的 ref 和 watch 用于创建响应式引用和监听变化
import { ref, watch } from 'vue';

// localStorage 存储键名
const STORAGE_KEY = 'reminder_todos';

/**
 * useTodos - 待办事项管理 Composable
 * 提供待办事项的增删改查、完成状态切换、番茄数统计等功能
 * 数据持久化到 localStorage，并在所有组件间共享状态
 */

// 创建全局共享的待办列表 ref（所有组件共享同一份数据）
const todos = ref([]);

// 从 localStorage 加载保存的待办事项
const savedTodos = localStorage.getItem(STORAGE_KEY);
if (savedTodos) {
  try {
    const parsed = JSON.parse(savedTodos);
    if (Array.isArray(parsed)) {
      // 确保是数组格式
      todos.value = parsed;
    } else {
      console.error('Saved todos is not an array, resetting to empty');
      todos.value = [];
    }
  } catch (e) {
    console.error('Failed to parse todos from localStorage', e);
  }
}

// 监听待办列表变化并自动保存到 localStorage
watch(todos, (newVal) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(newVal));
}, { deep: true }); // 深度监听数组内对象的变化

export function useTodos() {
  /**
   * 添加新的待办事项
   * @param {string} text - 待办内容
   * @param {string|null} typeId - 类型 ID
   */
  const addTodo = (text, typeId = null) => {
    if (!text.trim()) return; // 空内容不添加
    todos.value.unshift({ // 添加到数组开头
      id: Date.now(), // 使用时间戳作为唯一 ID
      text: text.trim(),
      typeId: typeId,
      completed: false,
      createdAt: new Date().toISOString(), // 创建时间
      pomodoros: 0, // 初始番茄数为 0
      completedAt: null // 完成时间（初始为空）
    });
  };

  /**
   * 删除指定的待办事项
   * @param {number} id - 待办 ID
   */
  const removeTodo = (id) => {
    todos.value = todos.value.filter(t => t.id !== id);
  };

  /**
   * 切换待办完成状态
   * @param {number} id - 待办 ID
   * @param {number} rating - 评分（1-5），完成时使用
   * @param {string} comment - 评论，完成时使用
   */
  const toggleTodo = (id, rating = 0, comment = '') => {
    const todo = todos.value.find(t => t.id === id);
    if (todo) {
      // 切换完成状态
      todo.completed = !todo.completed;
      // 设置或清空完成时间
      todo.completedAt = todo.completed ? new Date().toISOString() : null;
      if (todo.completed) {
        // 完成时记录评分和评论
        todo.rating = rating;
        todo.comment = comment;
      } else {
        // 取消完成时删除评分和评论
        delete todo.rating;
        delete todo.comment;
      }
    }
  };

  /**
   * 更新待办内容文本
   * @param {number} id - 待办 ID
   * @param {string} newText - 新的内容
   */
  const updateTodoText = (id, newText) => {
    const todo = todos.value.find(t => t.id === id);
    if (todo) {
      todo.text = newText.trim();
    }
  };

  /**
   * 为待办增加一个番茄钟计数
   * @param {number} id - 待办 ID
   */
  const incrementPomodoro = (id) => {
    const todo = todos.value.find(t => t.id === id);
    if (todo) {
      todo.pomodoros = (todo.pomodoros || 0) + 1;
    }
  };

  // 导出待办列表和相关方法
  return {
    todos,
    addTodo,
    removeTodo,
    toggleTodo,
    updateTodoText,
    incrementPomodoro
  };
}
