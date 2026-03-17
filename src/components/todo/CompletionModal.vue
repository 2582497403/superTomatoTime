<script setup>
import { ref, watch } from 'vue';
import BaseModal from '../BaseModal.vue';

const props = defineProps({
  show: Boolean,
  todo: Object
});

const emit = defineEmits(['close', 'confirm']);

const rating = ref(0);
const comment = ref('');
const error = ref('');

watch(() => props.show, (newVal) => {
  if (newVal) {
    rating.value = 0;
    comment.value = '';
    error.value = '';
  }
});

function setRating(val) {
  if (rating.value === val) {
    rating.value = 0; // Toggle off if clicking same star
  } else {
    rating.value = val;
  }
  if (rating.value > 0) error.value = '';
}

function handleConfirm() {
  if (rating.value === 0) {
    error.value = '请进行星级评分';
    return;
  }
  
  emit('confirm', {
    todoId: props.todo.id,
    rating: rating.value,
    comment: comment.value
  });
}
</script>

<template>
  <BaseModal :show="show" title="是否完成待办" @close="emit('close')">
    <div class="completion-content">
      <div class="star-rating">
        <span 
          v-for="i in 5" 
          :key="i" 
          class="star" 
          :class="{ active: i <= rating }"
          @click="setRating(i)"
        >
          {{ i <= rating ? '★' : '☆' }}
        </span>
      </div>
      
      <div class="comment-section">
        <textarea 
          v-model="comment" 
          placeholder="请填写完成情况..." 
          maxlength="500"
          class="comment-input"
        ></textarea>
        <div class="char-count">{{ comment.length }}/500</div>
      </div>

      <div v-if="error" class="error-msg">{{ error }}</div>
    </div>

    <template #footer>
      <button class="btn-cancel" @click="emit('close')">未完成</button>
      <button class="btn-confirm" @click="handleConfirm">确认完成</button>
    </template>
  </BaseModal>
</template>

<style scoped>
.completion-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 10px 0;
}

.star-rating {
  display: flex;
  justify-content: center;
  gap: 8px;
}

.star {
  font-size: 32px;
  cursor: pointer;
  color: #ccc;
  transition: color 0.2s;
  user-select: none;
}

.star.active {
  color: #ffd700; /* Gold */
}

.comment-section {
  position: relative;
}

.comment-input {
  width: 100%;
  height: 100px;
  padding: 10px;
  border: 1px solid var(--input-border);
  border-radius: 8px;
  background: var(--input-bg);
  color: var(--text-primary);
  resize: vertical;
  font-family: inherit;
}

.char-count {
  text-align: right;
  font-size: 12px;
  color: var(--text-secondary);
  margin-top: 4px;
}

.error-msg {
  color: var(--danger-color);
  font-size: 14px;
  text-align: center;
}

.btn-cancel {
  background: transparent;
  border: 1px solid var(--border-color);
  color: var(--text-secondary);
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
}

.btn-confirm {
  background: var(--primary-color);
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
}

.btn-confirm:hover {
  opacity: 0.9;
}
</style>
