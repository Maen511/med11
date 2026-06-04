import { Bell, Package, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useCustomerOrderNotifications } from '@/hooks/useCustomerOrderNotifications';
import {
  formatCustomerOrderNotificationBody,
  formatCustomerOrderNotificationTitle,
  type CustomerOrderNotification,
} from '@/lib/customerOrderNotifications';
import { formatDateTime } from '@/lib/formatNumbers';

type Props = {
  language: 'en' | 'ar';
  email?: string;
  username?: string;
  buttonClassName?: string;
};

export function CustomerOrderNotificationsBell({
  language,
  email,
  username,
  buttonClassName,
}: Props) {
  const navigate = useNavigate();
  const { notifications, unreadCount, markRead, markAllRead, dismiss } =
    useCustomerOrderNotifications(email, username);
  const isRtl = language === 'ar';
  const lang = isRtl ? 'ar' : 'en';

  const title = isRtl ? 'تنبيهات الطلبات' : 'Order updates';
  const empty = isRtl ? 'لا توجد تحديثات' : 'No updates yet';
  const markAll = isRtl ? 'تعليم الكل كمقروء' : 'Mark all read';
  const viewOrders = isRtl ? 'طلباتي' : 'My orders';

  const openNotification = (n: CustomerOrderNotification) => {
    markRead(n.id);
    navigate('/orders');
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={`relative ${buttonClassName ?? ''}`}
          aria-label={title}
          title={title}
        >
          <Bell className="h-4 w-4" />
          {unreadCount > 0 ? (
            <Badge
              variant="destructive"
              className="absolute -end-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] leading-none"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          ) : null}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 max-w-[calc(100vw-2rem)] p-0">
        <div className="flex items-center justify-between gap-2 px-3 py-2.5">
          <DropdownMenuLabel className="p-0 text-sm font-semibold">{title}</DropdownMenuLabel>
          {unreadCount > 0 ? (
            <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={markAllRead}>
              {markAll}
            </Button>
          ) : null}
        </div>
        <DropdownMenuSeparator className="m-0" />
        {notifications.length === 0 ? (
          <p className="px-3 py-6 text-center text-sm text-muted-foreground">{empty}</p>
        ) : (
          <ul className="max-h-72 overflow-y-auto py-1">
            {notifications.slice(0, 20).map((n) => (
              <li key={n.id} className="border-b border-border/40 last:border-0">
                <div className="flex items-start gap-1 px-2 py-1">
                  <button
                    type="button"
                    className="flex min-w-0 flex-1 gap-2 rounded-md px-1 py-2 text-start transition-colors hover:bg-muted/50"
                    onClick={() => openNotification(n)}
                  >
                    <Package className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <div className="min-w-0">
                      <p
                        className={`text-sm leading-snug ${!n.read ? 'font-semibold text-foreground' : 'text-foreground/90'}`}
                      >
                        {formatCustomerOrderNotificationTitle(n, lang)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatCustomerOrderNotificationBody(n, lang)}
                      </p>
                      <p className="mt-0.5 text-[10px] text-muted-foreground/80">
                        {formatDateTime(n.createdAt, language, {
                          dateStyle: 'short',
                          timeStyle: 'short',
                        })}
                      </p>
                    </div>
                  </button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 shrink-0 text-muted-foreground"
                    aria-label={isRtl ? 'إزالة' : 'Dismiss'}
                    onClick={() => dismiss(n.id)}
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
        <DropdownMenuSeparator className="m-0" />
        <div className="p-2">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="w-full"
            onClick={() => navigate('/orders')}
          >
            {viewOrders}
          </Button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
