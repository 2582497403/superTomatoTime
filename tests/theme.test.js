
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useSettings } from '../src/composables/useSettings';
import { ref } from 'vue';

// Mock Tauri invoke
const mockInvoke = vi.fn();

vi.mock('@tauri-apps/api/core', () => ({
  invoke: (...args) => mockInvoke(...args)
}));

describe('Theme Switching', () => {
  beforeEach(() => {
    mockInvoke.mockReset();
  });

  it('should have default theme as system', () => {
    const { themeMode } = useSettings();
    expect(themeMode.value).toBe('system');
  });

  it('should save theme setting', async () => {
    const { saveAppSetting } = useSettings();
    await saveAppSetting('themeMode', 'dark');
    expect(mockInvoke).toHaveBeenCalledWith('save_setting', {
      key: 'themeMode',
      value: 'dark'
    });
  });

  it('should load theme setting', async () => {
    mockInvoke.mockResolvedValueOnce('light'); // Mock get_setting return
    
    // We need to mock get_setting for all keys, but we only care about themeMode here
    // Since loadAppSettings loops through keys, we should set up the mock to handle multiple calls
    // or just check if themeMode is updated if we could isolate it.
    // However, invoke is called sequentially.
    
    mockInvoke.mockImplementation((cmd, args) => {
      if (cmd === 'get_setting' && args.key === 'themeMode') {
        return Promise.resolve('light');
      }
      return Promise.resolve(null);
    });

    const { loadAppSettings, themeMode } = useSettings();
    await loadAppSettings();
    expect(themeMode.value).toBe('light');
  });
});
