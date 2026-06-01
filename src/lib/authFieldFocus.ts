import type { KeyboardEvent, RefObject } from 'react';

/** Tab أو Enter ينقل التركيز للحقل التالي (مثلاً من اسم المستخدم إلى كلمة المرور). */
export function focusNextOnTabOrEnter(
  e: KeyboardEvent<HTMLInputElement>,
  nextRef: RefObject<HTMLInputElement | null>,
) {
  if (e.key === 'Tab' && e.shiftKey) return;
  if (e.key !== 'Tab' && e.key !== 'Enter') return;
  e.preventDefault();
  nextRef.current?.focus();
}
