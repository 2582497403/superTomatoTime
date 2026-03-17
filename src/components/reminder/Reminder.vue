<script setup>
import { ref, onMounted, computed } from 'vue';
import { useReminder } from '../../composables/useReminder';

// 使用提醒 composable
const { reminders, loadReminders, saveReminder, deleteReminder, triggerReminder, toggleReminderActive } = useReminder();

// 编辑状态
const editingId = ref(null);

// 表单数据
const formData = ref({
  type: 'interval', // 'interval' | 'scheduled'
  title: '',
  value: '' // 分钟数或时间字符串
});

// 开始编辑
const startEdit = (reminder = null) => {
  if (reminder) {
    editingId.value = reminder.id;
    formData.value = {
      type: reminder.type,
      title: reminder.title,
      value: reminder.value.toString()
    };
  } else {
    editingId.value = null;
    formData.value = {
      type: 'interval',
      title: '',
      value: ''
    };
  }
};

// 取消编辑
const cancelEdit = () => {
  editingId.value = null;
  formData.value = {
    type: 'interval',
    title: '',
    value: ''
  };
};

// 保存提醒
const handleSave = async () => {
  if (!formData.value.title.trim()) {
    alert('请输入提醒标题');
    return;
  }
  
  if (!formData.value.value) {
    alert('请设置提醒值');
    return;
  }
  
  try {
    await saveReminder({
      id: editingId.value,
      type: formData.value.type,
      title: formData.value.title,
      value: formData.value.value,
      is_active: true
    });
    cancelEdit();
  } catch (error) {
    console.error('保存失败:', error);
    alert('保存失败，请重试');
  }
};

// 删除提醒
const handleDelete = async (reminder) => {
  if (confirm(`确定要删除"${reminder.title}"吗？`)) {
    try {
      await deleteReminder(reminder.id);
    } catch (error) {
      console.error('删除失败:', error);
      alert('删除失败，请重试');
    }
  }
};

// 切换提醒启用状态
const handleToggleActive = async (reminder) => {
  try {
    await toggleReminderActive(reminder.id, !reminder.is_active);
  } catch (error) {
    console.error('切换状态失败:', error);
    alert('切换状态失败，请重试');
  }
};

// 测试提醒
const handleTest = async (reminder) => {
  try {
    await triggerReminder(reminder.title);
  } catch (error) {
    console.error('测试失败:', error);
    alert('测试失败，请重试');
  }
};

// 格式化显示文本
const formatReminderInfo = (reminder) => {
  if (reminder.type === 'interval') {
    return `每 ${reminder.value} 分钟循环`;
  } else {
    return `每天 ${reminder.value} 定时`;
  }
};

// 检查是否正在编辑
const isEditing = computed(() => editingId.value !== null);

// 组件挂载时加载数据
onMounted(async () => {
  await loadReminders();
});
</script>

<template>
  <div class="reminder-list-container">
    <div class="main-content">
      
      <!-- 添加/编辑表单 -->
      <div class="reminder-form">
        <div class="form-header">
          <h3>{{ isEditing ? '编辑提醒' : '添加提醒' }}</h3>
          <button v-if="isEditing" class="cancel-btn" @click="cancelEdit">✕ 取消</button>
        </div>
        
        <div class="form-body">
          <div class="form-row">
            <input 
              v-model="formData.title" 
              type="text" 
              placeholder="提醒标题（例如：喝水提醒）"
              class="title-input"
            />
            
            <div class="type-selector">
              <button 
                :class="['type-btn', { active: formData.type === 'interval' }]"
                @click="formData.type = 'interval'"
                title="循环提醒"
              >
                ⏰
              </button>
              <button 
                :class="['type-btn', { active: formData.type === 'scheduled' }]"
                @click="formData.type = 'scheduled'"
                title="定时提醒"
              >
                📅
              </button>
            </div>
            
            <input 
              v-if="formData.type === 'interval'"
              v-model="formData.value" 
              type="number" 
              min="1"
              placeholder="分钟数"
              class="value-input"
            />
            <input 
              v-else
              v-model="formData.value" 
              type="time"
              class="value-input"
            />
            
            <button class="save-btn" @click="handleSave">
              {{ isEditing ? '更新' : '添加' }}
            </button>
          </div>
        </div>
      </div>

      <!-- 提醒列表 -->
      <div class="reminder-list">
        <div v-if="reminders.length === 0" class="empty-state">
          <p>暂无提醒</p>
          <p class="hint">添加你的第一个提醒</p>
        </div>
        
        <TransitionGroup name="list" tag="div" v-else>
          <div v-for="reminder in reminders" :key="reminder.id" class="reminder-item">
            <div class="reminder-content">
              <div class="reminder-title">{{ reminder.title }}</div>
              <div class="reminder-info">{{ formatReminderInfo(reminder) }}</div>
            </div>
            
            <div class="actions">
              <!-- 启用/禁用开关 -->
              <label class="toggle-switch" :title="reminder.is_active ? '点击禁用' : '点击启用'">
                <input 
                  type="checkbox" 
                  :checked="reminder.is_active"
                  @change="handleToggleActive(reminder)"
                />
                <span class="slider"></span>
              </label>
              
              <button class="btn-icon btn-test" @click="handleTest(reminder)" title="测试">
                🔔
              </button>
              <button class="btn-icon btn-edit" @click="startEdit(reminder)" title="编辑">
                ✏️
              </button>
              <button class="btn-icon btn-delete" @click="handleDelete(reminder)" title="删除">
                🗑️
              </button>
            </div>
          </div>
        </TransitionGroup>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.reminder-list-container {
  display: flex;
  height: calc(100vh - 120px);
  min-height: 400px;
}

.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 20px;
  gap: 20px;
}

// 表单样式
.reminder-form {
  background: var(--card-bg);
  border-radius: var(--border-radius);
  padding: 16px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  border: 1px solid var(--border-color);
  transition: all 0.3s ease;
  
  &:focus-within {
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
    border-color: var(--primary-color);
  }
}

.form-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  
  h3 {
    margin: 0;
    font-size: 16px;
    font-weight: 600;
    color: var(--text-primary);
  }
  
  .cancel-btn {
    background: transparent;
    border: none;
    color: var(--text-secondary);
    cursor: pointer;
    font-size: 13px;
    padding: 4px 8px;
    border-radius: 4px;
    transition: all 0.2s;
    
    &:hover {
      background: var(--bg-color);
      color: var(--text-primary);
    }
  }
}

.form-body {
  .form-row {
    display: flex;
    gap: 12px;
    align-items: center;
  }
}

.title-input {
  flex: 1;
  padding: 10px 14px;
  border: 2px solid var(--border-color);
  border-radius: 8px;
  font-size: 14px;
  background: var(--input-bg);
  color: var(--text-primary);
  transition: border-color 0.2s;
  
  &:focus {
    outline: none;
    border-color: var(--primary-color);
  }
  
  &::placeholder {
    color: var(--text-secondary);
  }
}

.type-selector {
  display: flex;
  gap: 8px;
  
  .type-btn {
    width: 40px;
    height: 40px;
    border: 2px solid var(--border-color);
    background: var(--card-bg);
    border-radius: 8px;
    cursor: pointer;
    font-size: 18px;
    transition: all 0.2s;
    display: flex;
    align-items: center;
    justify-content: center;
    
    &.active {
      border-color: var(--primary-color);
      background: rgba(255, 107, 107, 0.1);
    }
    
    &:hover {
      border-color: var(--primary-color);
    }
  }
}

.value-input {
  width: 120px;
  padding: 10px 14px;
  border: 2px solid var(--border-color);
  border-radius: 8px;
  font-size: 14px;
  background: var(--input-bg);
  color: var(--text-primary);
  transition: border-color 0.2s;
  
  &:focus {
    outline: none;
    border-color: var(--primary-color);
  }
}

.save-btn {
  padding: 10px 24px;
  background: linear-gradient(135deg, var(--primary-color) 0%, var(--primary-dark) 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(255, 107, 107, 0.3);
  }
}

.reminder-list {
  flex: 1;
  overflow-y: auto;
}

.empty-state {
  text-align: center;
  color: var(--text-secondary);
  margin-top: 40px;
  
  p {
    margin: 8px 0;
    
    &.hint {
      font-size: 14px;
    }
  }
}

.reminder-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: var(--card-bg);
  border-radius: var(--border-radius);
  margin-bottom: 8px;
  transition: all 0.2s ease;
  border: 1px solid var(--border-color);
  gap: 12px;
  
  &:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.04);
    transform: translateY(-1px);
  }
}

.reminder-content {
  flex: 1;
  overflow: hidden;
}

.reminder-title {
  font-size: 16px;
  color: var(--text-primary);
  font-weight: 600;
  margin-bottom: 4px;
}

.reminder-info {
  font-size: 14px;
  color: var(--primary-color);
  font-weight: 500;
}

.actions {
  display: flex;
  gap: 8px;
  opacity: 0;
  transition: opacity 0.2s;
}

.reminder-item:hover .actions {
  opacity: 1;
}

// 开关样式
.toggle-switch {
  position: relative;
  display: inline-flex;
  align-items: center;
  width: 44px;
  height: 24px;
  margin-right: 8px;
  cursor: pointer;
  
  input {
    opacity: 0;
    width: 0;
    height: 0;
    
    &:checked + .slider {
      background-color: var(--primary-color);
    }
    
    &:checked + .slider:before {
      transform: translateX(20px);
    }
  }
  
  .slider {
    position: absolute;
    cursor: pointer;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: var(--border-color);
    transition: 0.3s;
    border-radius: 24px;
    
    &:before {
      position: absolute;
      content: "";
      height: 18px;
      width: 18px;
      left: 3px;
      bottom: 3px;
      background-color: white;
      transition: 0.3s;
      border-radius: 50%;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
    }
  }
  
  &:hover .slider {
    background-color: var(--text-secondary);
  }
}

.btn-icon {
  background: none;
  border: none;
  padding: 4px;
  border-radius: 4px;
  cursor: pointer;
  color: var(--text-secondary);
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  
  &:hover {
    background-color: var(--bg-color);
    color: var(--text-primary);
  }
}

.btn-test:hover {
  color: var(--primary-color);
  background-color: rgba(255, 107, 107, 0.1);
}

.btn-edit:hover {
  color: #ffa500;
  background-color: rgba(255, 165, 0, 0.1);
}

.btn-delete:hover {
  color: var(--danger-color);
  background-color: rgba(250, 82, 82, 0.1);
}

// 动画
.list-enter-active,
.list-leave-active {
  transition: all 0.3s ease;
}

.list-enter-from,
.list-leave-to {
  opacity: 0;
  transform: translateX(30px);
}
</style>