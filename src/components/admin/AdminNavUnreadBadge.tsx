import { cn } from '@/lib/utils';

type Variant = 'orders' | 'promo' | 'customers';

const toneClass: Record<Variant, string> = {
  orders: 'bg-red-500',
  promo: 'bg-violet-500',
  customers: 'bg-sky-500',
};

type Props = {
  count: number;
  variant: Variant;
};

/** مؤشر إشعار فقط — بدون نافذة منبثقة */
export default function AdminNavUnreadBadge({ count, variant }: Props) {
  if (count <= 0) return null;

  return (
    <span
      className={cn(
        'flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full px-1.5 text-[10px] font-semibold text-white',
        toneClass[variant],
      )}
      aria-hidden
    >
      {count > 9 ? '9+' : count}
    </span>
  );
}
