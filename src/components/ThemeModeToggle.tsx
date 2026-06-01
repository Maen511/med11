import { Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useThemePreference } from '@/hooks/useThemePreference';
import { cn } from '@/lib/utils';

type Props = {
  language: 'en' | 'ar';
  className?: string;
};

const ThemeModeToggle = ({ language, className }: Props) => {
  const { isDark, setLight, setDark } = useThemePreference();
  const isRtl = language === 'ar';

  const shell = 'rounded-lg border border-border/60 bg-muted/40 p-0.5';
  const active = 'bg-background text-foreground shadow-sm ring-1 ring-border/60';
  const idle = 'text-muted-foreground hover:bg-background/80 hover:text-foreground';

  return (
    <div
      role="group"
      aria-label={isRtl ? 'وضع العرض' : 'Theme mode'}
      className={cn('inline-flex items-center gap-0.5', shell, className)}
    >
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className={cn('h-8 w-8 shrink-0 rounded-md', !isDark ? active : idle)}
        onClick={setLight}
        aria-label={isRtl ? 'الوضع الفاتح' : 'Light mode'}
        aria-pressed={!isDark}
        title={isRtl ? 'فاتح' : 'Light'}
      >
        <Sun className="h-4 w-4" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className={cn('h-8 w-8 shrink-0 rounded-md', isDark ? active : idle)}
        onClick={setDark}
        aria-label={isRtl ? 'الوضع الداكن' : 'Dark mode'}
        aria-pressed={isDark}
        title={isRtl ? 'داكن' : 'Dark'}
      >
        <Moon className="h-4 w-4" />
      </Button>
    </div>
  );
};

export default ThemeModeToggle;
