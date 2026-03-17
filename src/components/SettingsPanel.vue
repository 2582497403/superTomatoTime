<script setup>
// 引入基础弹窗组件
import BaseModal from './BaseModal.vue';

/**
 * SettingsPanel - 设置面板组件
 * 提供应用的所有配置选项：主题、时间、待办类型、提示音等
 */

// 定义组件 Props（接收的父组件数据）
const props = defineProps({
  show: Boolean,                    // 是否显示设置面板
  notifyPosition: String,           // 通知位置
  textWorkStart: String,            // 工作开始通知文本
  textWorkEnd: String,              // 工作结束通知文本
  textRestStart: String,            // 休息开始通知文本
  textRestEnd: String,              // 休息结束通知文本
  themeMode: String,                // 主题模式
  soundEnabled: Boolean,            // 是否启用提示音
  soundVolume: Number,              // 音量
  selectedSound: String,            // 选择的音效
  workDuration: Number,             // 工作时长
  restDuration: Number              // 休息时长
});

// 定义组件 Events（向父组件发送的事件）
const emit = defineEmits([
  'update:notifyPosition',   // 更新通知位置
  'update:textWorkStart',    // 更新工作开始文本
  'update:textWorkEnd',      // 更新工作结束文本
  'update:textRestStart',    // 更新休息开始文本
  'update:textRestEnd',      // 更新休息结束文本
  'update:themeMode',        // 更新主题模式
  'update:soundEnabled',     // 更新是否启用声音
  'update:soundVolume',      // 更新音量
  'update:selectedSound',    // 更新选择的音效
  'update:workDuration',     // 更新工作时长
  'update:restDuration',     // 更新休息时长
  'close',                   // 关闭事件
  'save'                     // 保存事件
]);

// 引入音频播放和待办类型管理 composable
import { useAudio } from '../composables/useAudio';
import { useTodoTypes } from '../composables/useTodoTypes';
import { ref } from 'vue';
import TypeBadge from './todo/TypeBadge.vue';

const { playSound } = useAudio(); // 播放提示音
const { todoTypes, addType, removeType, updateType } = useTodoTypes(); // 待办类型管理

// ==================== 待办类型编辑相关状态 ====================
// 新建类型的表单数据
const newTypeName = ref('');
const newTypeEmoji = ref('📝');
// 编辑类型的表单数据
const editingTypeId = ref(null);
const editingTypeName = ref('');
const editingTypeEmoji = ref('');

/**
 * 添加新的待办类型
 */
function handleAddType() {
  if (newTypeName.value.trim()) {
    addType(newTypeName.value, newTypeEmoji.value);
    // 清空表单
    newTypeName.value = '';
    newTypeEmoji.value = '📝';
  }
}

/**
 * 开始编辑类型
 * @param {Object} type - 要编辑的类型对象
 */
function startEditType(type) {
  editingTypeId.value = type.id;
  editingTypeName.value = type.name;
  editingTypeEmoji.value = type.emoji;
}

/**
 * 保存类型编辑
 */
function saveEditType() {
  if (editingTypeId.value && editingTypeName.value.trim()) {
    updateType(editingTypeId.value, editingTypeName.value, editingTypeEmoji.value);
    cancelEditType(); // 清空编辑状态
  }
}

/**
 * 取消编辑类型
 */
function cancelEditType() {
  editingTypeId.value = null;
  editingTypeName.value = '';
  editingTypeEmoji.value = '';
}

/**
 * 试听提示音
 */
function testSound() {
  playSound(true, props.soundVolume, props.selectedSound);
}

/**
 * 更新设置项并触发保存
 * @param {string} key - 设置键名
 * @param {any} value - 设置值
 */
function updateSetting(key, value) {
  emit(`update:${key}`, value); // 触发更新事件
  emit('save', key, value);     // 触发保存事件
}
</script>

<template>
  <!-- 使用 BaseModal 作为设置弹窗的基础容器 -->
  <BaseModal :show="show" title="⚙️ 设置" @close="emit('close')">
    <div class="settings-content">
      <!-- 主题设置 -->
      <div class="settings-group">
        <label>主题模式</label>
        <select :value="themeMode" @change="e => updateSetting('themeMode', e.target.value)">
          <option value="system">跟随系统</option>
          <option value="light">浅色模式</option>
          <option value="dark">深色模式</option>
        </select>
      </div>

      <div class="divider"></div>

      <!-- 番茄时间预设 -->
      <div class="settings-group">
        <label>番茄时间预设</label>
        <input 
          type="number" 
          min="1" 
          :value="workDuration" 
          @input="e => updateSetting('workDuration', parseInt(e.target.value))" 
          placeholder="工作时长 (分钟)"
        />
        <input 
          type="number" 
          min="1" 
          :value="restDuration" 
          @input="e => updateSetting('restDuration', parseInt(e.target.value))" 
          placeholder="休息时长 (分钟)"
        />
      </div>

      <div class="divider"></div>

      <!-- 待办类型管理 -->
      <div class="settings-group">
        <label>待办类型管理</label>
        <div class="types-list">
          <div v-for="type in todoTypes" :key="type.id" class="type-item">
            <!-- 编辑模式 -->
            <template v-if="editingTypeId === type.id">
              <input v-model="editingTypeEmoji" class="emoji-input" placeholder="Emoji" />
              <input v-model="editingTypeName" class="name-input" placeholder="类型名称" @keyup.enter="saveEditType" />
              <div class="type-actions">
                <button class="btn-icon btn-save" @click="saveEditType">✅</button>
                <button class="btn-icon btn-cancel" @click="cancelEditType">❌</button>
              </div>
            </template>
            <!-- 查看模式 -->
            <template v-else>
              <TypeBadge :type="type" size="18px" style="margin-right: 8px;" />
              <span class="type-name">{{ type.name }}</span>
              <div class="type-actions">
                <button class="btn-icon btn-edit" @click="startEditType(type)">✏️</button>
                <button class="btn-icon btn-delete" @click="removeType(type.id)">🗑️</button>
              </div>
            </template>
          </div>
        </div>
        
        <!-- 添加新类型表单 -->
        <div class="add-type-form">
          <input v-model="newTypeEmoji" class="emoji-input" placeholder="Emoji" />
          <input v-model="newTypeName" class="name-input" placeholder="新类型名称。左边图标可以删除后 win+;选择表情" @keyup.enter="handleAddType" />
          <button class="btn-add" @click="handleAddType">添加</button>
        </div>
      </div>

      <div class="divider"></div>

      <!-- 提示音开关 -->
      <div class="settings-group row">
        <label>开启提示音</label>
        <label class="switch">
          <input type="checkbox" :checked="soundEnabled" @change="e => updateSetting('soundEnabled', e.target.checked)">
          <span class="slider round"></span>
        </label>
      </div>

      <!-- 提示音详细设置（仅在开启时显示） -->
      <div v-if="soundEnabled" class="sound-settings">
        <div class="settings-group">
          <label>提示音类型</label>
          <select :value="selectedSound" @change="e => updateSetting('selectedSound', e.target.value)">
            <option value="default">默认 (柔和)</option>
            <option value="chime">清脆铃声</option>
            <option value="digital">电子音</option>
            <option value="drop">水滴声</option>
            <option value="music1">音乐 1</option>
            <option value="music2">音乐 2</option>
            <option value="music3">音乐 3</option>
            <option value="music4">音乐 4</option>
            <option value="music5">音乐 5</option>
            <option value="music6">音乐 6</option>
            <option value="music7">音乐 7</option>
          </select>
        </div>

        <div class="settings-group">
          <label>音量 ({{ soundVolume }}%)</label>
          <input 
            type="range" 
            min="0" 
            max="100" 
            :value="soundVolume" 
            @input="e => updateSetting('soundVolume', parseInt(e.target.value))"
          />
        </div>

        <!-- 试听按钮 -->
        <button class="btn-test" @click="testSound">
          ▶ 试听
        </button>
      </div>
    </div>
    
    <!-- 底部按钮区域 -->
    <template #footer>
      <button class="btn-primary" @click="emit('close')">完成</button>
    </template>
  </BaseModal>
</template>

<style scoped>
.settings-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.settings-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.settings-group label {
  font-size: 13px;
  color: var(--text-secondary);
  font-weight: 600;
}

.settings-group select, .settings-group input {
  padding: 10px;
  border: 1px solid var(--input-border);
  border-radius: 8px;
  background: var(--input-bg);
  color: var(--text-primary);
  font-size: 14px;
  transition: border-color 0.2s;
}

.settings-group select:focus, .settings-group input:focus {
  outline: none;
  border-color: var(--primary-color);
}

.btn-primary {
  background-color: var(--primary-color);
  color: white;
  border: none;
  padding: 10px 24px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.2s;
}

.btn-primary:hover {
  opacity: 0.9;
}

.divider {
  height: 1px;
  background-color: var(--border-color);
  margin: 4px 0;
}

.settings-group.row {
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
}

.sound-settings {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding-left: 10px;
  border-left: 2px solid var(--border-color);
}

.btn-test {
  align-self: flex-start;
  background: none;
  border: 1px solid var(--primary-color);
  color: var(--primary-color);
  padding: 6px 12px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
  transition: all 0.2s;
}

.btn-test:hover {
  background: var(--primary-color);
  color: white;
}

.file-input-wrapper {
  display: flex;
  gap: 8px;
}

.input-readonly {
  flex: 1;
  background: var(--bg-color) !important;
  cursor: default;
  color: var(--text-secondary) !important;
}

.btn-select {
  padding: 0 12px;
  background: var(--bg-color);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  cursor: pointer;
  color: var(--text-primary);
  font-size: 13px;
  white-space: nowrap;
  transition: all 0.2s;
}

.btn-select:hover {
  border-color: var(--primary-color);
  color: var(--primary-color);
}

/* Toggle Switch */
.switch {
  position: relative;
  display: inline-block;
  width: 40px;
  height: 22px;
}

.switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #ccc;
  transition: .4s;
}

.slider:before {
  position: absolute;
  content: "";
  height: 16px;
  width: 16px;
  left: 3px;
  bottom: 3px;
  background-color: white;
  transition: .4s;
}

input:checked + .slider {
  background-color: var(--success-color);
}

input:focus + .slider {
  box-shadow: 0 0 1px var(--success-color);
}

input:checked + .slider:before {
  transform: translateX(18px);
}

.slider.round {
  border-radius: 22px;
}

.slider.round:before {
  border-radius: 50%;
}

/* Todo Types */
.types-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 8px;
}

.type-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px;
  border-radius: 6px;
  background: var(--bg-color);
}

.emoji-input {
  width: 40px;
  text-align: center;
}

.name-input {
  flex: 1;
}

/* .type-emoji removed as it is replaced by TypeBadge component */

.type-name {
  flex: 1;
  font-size: 14px;
}

.type-actions {
  display: flex;
  gap: 4px;
}

.btn-icon {
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  font-size: 14px;
}

.btn-icon:hover {
  background: var(--border-color);
}

.add-type-form {
  display: flex;
  gap: 8px;
  margin-top: 8px;
}

.btn-add {
  padding: 0 12px;
  background: var(--primary-color);
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 13px;
}
</style>
