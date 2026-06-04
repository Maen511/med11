import type { MouseEvent } from 'react';
import { Check } from 'lucide-react';
import {
  ORDER_TRACK_STEPS,
  orderStepIndex,
  orderStepLabel,
  type OrderTrackStatus,
} from '@/lib/invoices';
import { cn } from '@/lib/utils';

type Props = {
  status?: string;
  language: 'en' | 'ar';
  onStatusChange?: (status: OrderTrackStatus) => void;
  /** إن وُجدت: فقط هذه المراحل قابلة للنقر */
  clickableSteps?: OrderTrackStatus[];
  readOnly?: boolean;
  compact?: boolean;
  className?: string;
};

const OrderStatusStepper = ({
  status,
  language,
  onStatusChange,
  clickableSteps,
  readOnly,
  compact,
  className,
}: Props) => {
  const lang = language === 'ar' ? 'ar' : 'en';
  const activeIndex = orderStepIndex(status);
  const interactive = Boolean(onStatusChange) && !readOnly;
  const canClickStep = (step: OrderTrackStatus) =>
    interactive && clickableSteps != null && clickableSteps.includes(step);

  const fireStatusChange = (step: OrderTrackStatus, e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!canClickStep(step)) return;
    onStatusChange?.(step);
  };

  return (
    <div
      className={cn('w-full', className)}
      role={interactive ? 'group' : undefined}
      aria-label={lang === 'ar' ? 'مراحل التوصيل' : 'Delivery progress'}
    >
      <div className={cn('flex items-start justify-between', compact ? 'gap-0.5' : 'gap-1')}>
        {ORDER_TRACK_STEPS.map((step, index) => {
          const isCurrent = index === activeIndex;
          const isFuture = index > activeIndex;
          /** «تم التوصيل» = اكتمال كامل — أخضر وليس لون المرحلة الحالية (أبيض/أساسي) */
          const isDeliveredFinal = isCurrent && step === 'delivered';
          const isComplete = index < activeIndex || isDeliveredFinal;
          const lineFilled = index > 0 && index <= activeIndex;

          const circle = (
            <span
              className={cn(
                'relative z-10 flex shrink-0 items-center justify-center rounded-full border-2 font-semibold transition-all',
                compact ? 'h-7 w-7 text-[10px]' : 'h-9 w-9 text-xs',
                isComplete &&
                  cn(
                    'border-emerald-600 bg-emerald-600 text-white shadow-sm',
                    isDeliveredFinal && (compact ? 'ring-2 ring-emerald-500/35' : 'ring-4 ring-emerald-500/30'),
                  ),
                isCurrent &&
                  !isDeliveredFinal &&
                  cn(
                    'border-primary bg-primary text-primary-foreground shadow-md',
                    compact ? 'ring-2 ring-primary/20' : 'ring-4 ring-primary/20',
                  ),
                isFuture && 'border-muted-foreground/35 bg-muted/50 text-muted-foreground',
                canClickStep(step) &&
                  'cursor-pointer hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
              )}
            >
              {isComplete ? (
                <Check className={compact ? 'h-3 w-3' : 'h-4 w-4'} strokeWidth={2.5} />
              ) : (
                index + 1
              )}
            </span>
          );

          return (
            <div key={step} className="flex min-w-0 flex-1 flex-col items-center">
              <div className="relative flex w-full items-center justify-center">
                {index > 0 ? (
                  <span
                    className={cn(
                      'absolute end-1/2 top-1/2 h-0.5 w-full -translate-y-1/2 bg-muted-foreground/20',
                      lineFilled && 'bg-emerald-500/70',
                    )}
                    aria-hidden
                  />
                ) : null}
                {canClickStep(step) ? (
                  <button
                    type="button"
                    onClick={(e) => fireStatusChange(step, e)}
                    aria-label={orderStepLabel(step, lang)}
                    aria-current={isCurrent ? 'step' : undefined}
                    className="relative z-10 rounded-full"
                  >
                    {circle}
                  </button>
                ) : (
                  <div className="relative z-10" aria-current={isCurrent ? 'step' : undefined}>
                    {circle}
                  </div>
                )}
              </div>
              {canClickStep(step) ? (
                <button
                  type="button"
                  onClick={(e) => fireStatusChange(step, e)}
                  className={cn(
                    'cursor-pointer rounded-md px-0.5 text-center leading-tight transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                    compact ? 'mt-1.5 max-w-[3.75rem] text-[9px]' : 'mt-2 max-w-[5.5rem] text-[10px] sm:max-w-none sm:text-xs',
                    (isComplete || isDeliveredFinal) && 'font-semibold text-emerald-700 dark:text-emerald-400',
                    isCurrent && !isDeliveredFinal && 'font-semibold text-foreground',
                    isFuture && 'text-muted-foreground',
                  )}
                >
                  {orderStepLabel(step, lang)}
                </button>
              ) : (
                <p
                  className={cn(
                    'text-center leading-tight',
                    compact ? 'mt-1.5 max-w-[3.75rem] text-[9px]' : 'mt-2 max-w-[5.5rem] text-[10px] sm:max-w-none sm:text-xs',
                    (isComplete || isDeliveredFinal) && 'font-semibold text-emerald-700 dark:text-emerald-400',
                    isCurrent && !isDeliveredFinal && 'font-semibold text-foreground',
                    isFuture && 'text-muted-foreground',
                  )}
                >
                  {orderStepLabel(step, lang)}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default OrderStatusStepper;
