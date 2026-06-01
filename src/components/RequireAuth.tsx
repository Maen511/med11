import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

/** يتطلب وجود حساب فقط (بدون اشتراط رمز الكتالوج) */
export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return <>{children}</>;
}

/** يتطلب تفعيل الكتالوج من الإدارة؛ يُوجَّه لملفه الشخصي إن لم يُمنح الوصول */
export function RequireCatalogAccess({ children }: { children: React.ReactNode }) {
  const { user, canAccessCatalog } = useAuth();
  const location = useLocation();

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }
  if (!canAccessCatalog) {
    return <Navigate to="/profile" replace state={{ from: location.pathname, needCatalogAccess: true }} />;
  }

  return <>{children}</>;
}

/** يتطلب صلاحية قسم معيّن (بعد منح الوصول من الإدارة) */
export function RequireSectionAccess({
  sectionId,
  children,
}: {
  sectionId: string;
  children: React.ReactNode;
}) {
  const { user, canAccessCatalog, canAccessSection, isAdmin } = useAuth();
  const location = useLocation();

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }
  if (!canAccessCatalog) {
    return <Navigate to="/profile" replace state={{ from: location.pathname, needCatalogAccess: true }} />;
  }
  if (!isAdmin && !canAccessSection(sectionId)) {
    return (
      <Navigate
        to="/profile"
        replace
        state={{ from: location.pathname, sectionDenied: sectionId }}
      />
    );
  }

  return <>{children}</>;
}

/** صفحات العملاء فقط — يُعاد المسؤول لملفه الشخصي */
export function RequireCustomerAccount({ children }: { children: React.ReactNode }) {
  const { isAdmin } = useAuth();

  if (isAdmin) {
    return <Navigate to="/profile" replace />;
  }

  return <>{children}</>;
}
