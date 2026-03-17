// 引入 Vue 的 ref 用于创建响应式引用
import { ref } from 'vue';

/**
 * useAudio - 音频播放 Composable
 * 提供番茄钟提示音播放功能，支持振荡器生成音效和播放音频文件
 */
export function useAudio() {
  // 音频上下文引用（Web Audio API）
  const audioContext = ref(null);

  /**
   * 获取或创建音频上下文
   * @returns {AudioContext} 音频上下文对象
   */
  const getAudioContext = () => {
    if (!audioContext.value) {
      // 根据浏览器兼容性创建 AudioContext
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      audioContext.value = new AudioContext();
    }
    // 如果音频上下文被挂起，则恢复它
    if (audioContext.value.state === 'suspended') {
      audioContext.value.resume();
    }
    return audioContext.value;
  };

  /**
   * 使用振荡器播放提示音
   * @param {string} type - 波形类型：'sine'|'square'|'sawtooth'|'triangle'
   * @param {number} freqStart - 起始频率 (Hz)
   * @param {number} freqEnd - 结束频率 (Hz)，可选
   * @param {number} duration - 持续时间 (秒)
   * @param {number} volume - 音量 (0-1)
   */
  const playOscillator = (type, freqStart, freqEnd, duration, volume) => {
    const ctx = getAudioContext();
    // 创建振荡器节点（声音源）
    const oscillator = ctx.createOscillator();
    // 创建增益节点（音量控制）
    const gainNode = ctx.createGain();

    oscillator.type = type; // 设置波形类型
    // 设置频率变化
    oscillator.frequency.setValueAtTime(freqStart, ctx.currentTime);
    if (freqEnd) {
      // 如果有结束频率，则创建指数渐变效果
      oscillator.frequency.exponentialRampToValueAtTime(freqEnd, ctx.currentTime + duration);
    }

    // 设置音量变化：从设定音量渐变到接近静音
    gainNode.gain.setValueAtTime(volume, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

    // 连接音频链路：振荡器 -> 增益节点 -> 输出设备
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    // 开始播放并在指定时间后停止
    oscillator.start();
    oscillator.stop(ctx.currentTime + duration);
  };

  /**
   * 播放音频文件
   * @param {string} path - 音频文件路径
   * @param {number} volume - 音量 (0-1)
   */
  const playAudioFile = async (path, volume) => {
    try {
      // 创建 HTML5 Audio 对象
      const audio = new Audio(path);
      audio.volume = volume;
      await audio.play();
    } catch (err) {
      console.error(`Failed to play audio file ${path}:`, err);
    }
  };

  /**
   * 播放提示音主函数
   * @param {boolean} enabled - 是否启用声音
   * @param {number} volumePercent - 音量百分比 (0-100)
   * @param {string} soundType - 音效类型：default|chime|digital|drop|music1-7
   */
  const playSound = async (enabled, volumePercent, soundType) => {
    if (!enabled) return; // 如果禁用声音则直接返回

    // 将音量百分比转换为 0-1 范围
    const volume = Math.max(0, Math.min(1, volumePercent / 100));

    try {
      // 如果是 music 类型，播放预设的 MP3 文件
      if (soundType.startsWith('music')) {
        const path = `/ringtone/${soundType}.mp3`;
        await playAudioFile(path, volume);
        return;
      }

      // 根据不同类型播放不同的振荡器音效
      switch (soundType) {
        case 'default': // 默认提示音：柔和的正弦波，从 880Hz 降到 440Hz
          playOscillator('sine', 880, 440, 0.5, volume);
          break;
        case 'chime': // 清脆铃声：高频正弦波，从 1200Hz 降到 800Hz
          playOscillator('sine', 1200, 800, 1.0, volume);
          break;
        case 'digital': // 电子音：方波，连续两个音调
          playOscillator('square', 600, 600, 0.2, volume * 0.5); // 方波比较响，降低音量
          setTimeout(() => {
             playOscillator('square', 800, 800, 0.2, volume * 0.5);
          }, 250);
          break;
        case 'drop': // 水滴声：快速降调的正弦波
          playOscillator('sine', 1500, 100, 0.2, volume);
          break;
        default: // 默认使用 sine 波
          playOscillator('sine', 880, 440, 0.5, volume);
      }
    } catch (err) {
      console.error("Play sound error:", err);
    }
  };

  // 导出 playSound 方法供外部使用
  return {
    playSound
  };
}
