// 引入 Vue 3 的响应式 API 和生命周期钩子
import { ref, computed, onUnmounted } from 'vue';

/**
 * useTimer - 番茄钟计时器管理 Composable
 * 提供专注和休息的倒计时功能，以及相关的状态管理
 * @param {Ref<number>} workDuration - 工作时长（分钟）
 * @param {Ref<number>} restDuration - 休息时长（分钟）
 * @param {Function} onEndWork - 工作结束回调
 * @param {Function} onEndRest - 休息结束回调
 * @param {Function} onStartWork - 工作开始回调
 * @param {Function} onStartRest - 休息开始回调
 */
export function useTimer(workDuration, restDuration, onEndWork, onEndRest, onStartWork, onStartRest) {
  // 当前番茄钟轮次
  const currentRound = ref(0);
  // 计时器状态：'idle'(空闲) | 'working'(工作中) | 'resting'(休息中)
  const timerState = ref("idle");
  // 剩余时间（秒）
  const timeLeft = ref(0);
  // 总时长（秒）
  const totalTime = ref(0);
  // 专注开始时间
  const startTime = ref("");
  // 休息开始时间
  const restStartTime = ref("");
  // 工作计划
  const workPlan = ref("");
  // 工作总结
  const workSummary = ref("");

  // 定时器 ID
  let timerInterval = null;

  /**
   * 计算属性：倒计时进度百分比
   * @returns {number} 0-100 的进度值
   */
  const progress = computed(() => {
    if (totalTime.value === 0) return 0;
    return ((totalTime.value - timeLeft.value) / totalTime.value) * 100;
  });

  /**
   * 计算属性：格式化剩余时间为 MM:SS 格式
   * @returns {string} "MM:SS" 格式的字符串
   */
  const formattedTime = computed(() => {
    const mins = Math.floor(timeLeft.value / 60);
    const secs = timeLeft.value % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  });

  /**
   * 开始一个新的番茄钟轮次
   * 只有在空闲状态下才能启动
   */
  function startRound() {
    if (timerState.value !== "idle") return; // 非空闲状态不能启动
    currentRound.value++; // 轮次 +1
    startWork(); // 开始工作
  }

  /**
   * 开始专注阶段
   * 设置状态、时间和触发工作开始回调
   */
  function startWork() {
    timerState.value = "working"; // 设置为工作状态
    timeLeft.value = workDuration.value * 60; // 转换为秒
    totalTime.value = timeLeft.value;
    startTime.value = new Date().toLocaleString(); // 记录开始时间
    workSummary.value = ""; // 清空工作总结
    
    if (onStartWork) onStartWork(currentRound.value, workDuration.value); // 触发回调
    startTimer(endWork); // 启动定时器
  }

  /**
   * 结束专注阶段
   * 停止定时器并触发工作结束回调
   */
  function endWork() {
    stopTimer(); // 停止定时器
    if (onEndWork) onEndWork(); // 触发回调
  }

  /**
   * 开始休息阶段
   * 创建休息记录并触发休息开始回调
   */
  function startRest() {
    timerState.value = "resting"; // 设置为休息状态
    timeLeft.value = restDuration.value * 60; // 转换为秒
    totalTime.value = timeLeft.value;
    restStartTime.value = new Date().toLocaleString(); // 记录休息开始时间
    
    // 创建工作记录对象
    const record = {
      round_number: currentRound.value,
      work_start_time: startTime.value,
      work_duration_minutes: workDuration.value,
      work_plan: workPlan.value,
      work_summary: workSummary.value,
      rest_start_time: restStartTime.value,
      rest_duration_minutes: restDuration.value,
    };

    if (onStartRest) onStartRest(restDuration.value, record); // 触发回调
    startTimer(endRest); // 启动定时器
  }

  /**
   * 结束休息阶段
   * 停止定时器、触发回调并重置为空闲状态
   */
  async function endRest() {
    stopTimer(); // 停止定时器
    if (onEndRest) await onEndRest(); // 触发回调
    timerState.value = "idle"; // 重置为空闲状态
  }

  /**
   * 启动倒计时定时器
   * @param {Function} callback - 倒计时结束时的回调函数
   */
  function startTimer(callback) {
    stopTimer(); // 先清除之前的定时器（如果有）
    // 每秒减少一次剩余时间
    timerInterval = setInterval(() => {
      if (timeLeft.value > 0) {
        timeLeft.value--; // 时间减 1
      } else {
        callback(); // 时间到，执行回调
      }
    }, 1000);
  }

  /**
   * 停止定时器
   * 清除当前的定时器间隔
   */
  function stopTimer() {
    if (timerInterval) {
      clearInterval(timerInterval);
      timerInterval = null;
    }
  }

  /**
   * 重置所有状态
   * 停止定时器并清空所有数据
   */
  function resetAll() {
    stopTimer(); // 停止定时器
    timerState.value = "idle"; // 重置状态
    currentRound.value = 0; // 重置轮次
    timeLeft.value = 0; // 清空时间
    workPlan.value = ""; // 清空计划
    workSummary.value = ""; // 清空总结
  }

  // 组件卸载时自动停止定时器
  onUnmounted(() => {
    stopTimer();
  });

  // 导出所有计时器相关的状态和方法
  return {
    currentRound,
    timerState,
    timeLeft,
    totalTime,
    startTime,
    restStartTime,
    workPlan,
    workSummary,
    progress,
    formattedTime,
    startRound,
    startWork,
    startRest,
    resetAll
  };
}
