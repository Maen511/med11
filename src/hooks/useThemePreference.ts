import { useCallback, useEffect, useState } from 'react';
import {
  getThemePreference,
  isDarkThemeActive,
  setThemePreference,
  subscribeThemeChanges,
  type ThemePreference,
} from '@/lib/theme';

export function useThemePreference() {
  const [preference, setPreference] = useState<ThemePreference>(getThemePreference);
  const [isDark, setIsDark] = useState(isDarkThemeActive);

  useEffect(() => {
    const sync = () => {
      setPreference(getThemePreference());
      setIsDark(isDarkThemeActive());
    };
    sync();
    return subscribeThemeChanges(sync);
  }, []);

  const setLight = useCallback(() => setThemePreference('light'), []);
  const setDark = useCallback(() => setThemePreference('dark'), []);

  return { preference, isDark, setLight, setDark };
}
