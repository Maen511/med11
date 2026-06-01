import { LucideIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

type Props = {
  label: string;
  value: string | number;
  hint?: string;
  icon: LucideIcon;
  tone?: 'default' | 'success' | 'warning' | 'danger';
};

const toneStyles = {
  default: 'bg-muted/50 text-foreground',
  success: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
  warning: 'bg-amber-500/10 text-amber-800 dark:text-amber-300',
  danger: 'bg-red-500/10 text-red-700 dark:text-red-400',
};

const AdminStatCard = ({ label, value, hint, icon: Icon, tone = 'default' }: Props) => (
  <Card className="overflow-hidden border-border/60 shadow-sm transition-shadow hover:shadow-md">
    <CardContent className="flex items-start gap-4 p-5">
      <div className={cn('flex h-11 w-11 shrink-0 items-center justify-center rounded-xl', toneStyles[tone])}>
        <Icon className="h-5 w-5" aria-hidden />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
        <p className="mt-1 text-2xl font-semibold tabular-nums tracking-tight">{value}</p>
        {hint ? <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p> : null}
      </div>
    </CardContent>
  </Card>
);

export default AdminStatCard;
