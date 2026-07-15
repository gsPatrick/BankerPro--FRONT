'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import Sidebar from '@/components/organisms/Sidebar/Sidebar';
import NavBar from '@/components/organisms/NavBar/NavBar';
import BottomNav from '@/components/organisms/BottomNav/BottomNav';
import Modal from '@/components/organisms/Modal/Modal';
import UserMenu from '@/components/molecules/UserMenu/UserMenu';
import OnboardingFlow from '@/components/organisms/OnboardingFlow/OnboardingFlow';
import LogoutTransition from '@/components/organisms/LogoutTransition/LogoutTransition';
import ProductTour from '@/components/organisms/ProductTour/ProductTour';
import {
  isProductTourCompleted,
  clearProductTourLocal,
} from '@/lib/productTour';
import {
  getVisibleNavItems,
  getMobilePrimaryItems,
  getMobileSecondaryItems,
  getActiveNavId,
  getNavItemById,
  getShellContext,
} from '@/lib/platformNav';
import styles from './AppShell.module.css';

const SIDEBAR_COLLAPSED_KEY = 'bankerpro_sidebar_collapsed';
const LOGOUT_HOLD_MS = 1200;
const LOGOUT_FADE_MS = 280;

/**
 * Organism: AppShell
 * Desktop: collapsible sidebar + top header with user menu + fluid content.
 * Mobile: top bar + content + primary bottom nav + "Mais" sheet.
 */
export default function AppShell({
  children,
  title,
  subtitle,
  initialUser = null,
  needsOnboarding = false,
  onOnboardingComplete,
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState(initialUser);
  const [collapsed, setCollapsed] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(needsOnboarding);
  const [loggingOut, setLoggingOut] = useState(false);
  const [logoutExiting, setLogoutExiting] = useState(false);
  const [showTour, setShowTour] = useState(false);

  useEffect(() => {
    setShowOnboarding(needsOnboarding);
  }, [needsOnboarding]);

  useEffect(() => {
    if (!showOnboarding && !isProductTourCompleted()) {
      setShowTour(true);
    } else {
      setShowTour(false);
    }
  }, [showOnboarding]);

  const handleStartTour = () => {
    clearProductTourLocal();
    setShowTour(true);
  };

  useEffect(() => {
    if (initialUser) setUser(initialUser);
  }, [initialUser]);

  const userRole = user?.role || 'user';
  const sidebarItems = useMemo(
    () => getVisibleNavItems(userRole).filter((item) => item.id !== 'perfil'),
    [userRole]
  );
  const mobilePrimaryItems = useMemo(() => getMobilePrimaryItems(userRole), [userRole]);
  const mobileSecondaryItems = useMemo(
    () => getMobileSecondaryItems(userRole).filter((item) => item.id !== 'perfil'),
    [userRole]
  );

  const activeId = useMemo(() => getActiveNavId(pathname), [pathname]);
  const shellContext = useMemo(() => getShellContext(pathname), [pathname]);
  const activeItem = getNavItemById(activeId);
  const isSecondaryActive = mobileSecondaryItems.some((item) => item.id === activeId);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const raw = localStorage.getItem('bankerpro_user');
      if (raw) setUser(JSON.parse(raw));
    } catch {
      // keep current user
    }

    const saved = localStorage.getItem(SIDEBAR_COLLAPSED_KEY);
    if (saved === 'true') setCollapsed(true);
  }, [pathname]);

  useEffect(() => {
    setMoreOpen(false);
  }, [pathname]);

  const handleToggleCollapse = () => {
    setCollapsed((current) => {
      const next = !current;
      localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(next));
      return next;
    });
  };

  const handleLogout = () => {
    if (loggingOut) return;
    setLoggingOut(true);
    setMoreOpen(false);

    const clearSession = () => {
      localStorage.removeItem('bankerpro_token');
      localStorage.removeItem('bankerpro_user');
      localStorage.removeItem('bankerpro_plan_selected');
      localStorage.removeItem('bankerpro_onboarding_completed');
      localStorage.removeItem('bankerpro_sidebar_collapsed');
    };

    window.setTimeout(() => {
      clearSession();
      setLogoutExiting(true);
      window.setTimeout(() => {
        router.replace('/?view=gate');
      }, LOGOUT_FADE_MS);
    }, LOGOUT_HOLD_MS);
  };

  const handleOnboardingComplete = (userPatch = {}) => {
    setUser((current) => ({
      ...(current || {}),
      ...userPatch,
      onboardingCompleted: true,
    }));
    setShowOnboarding(false);
    onOnboardingComplete?.();
  };

  const pageTitle =
    title ||
    (shellContext.isRoot
      ? activeItem?.label || 'Closer.IA'
      : shellContext.title || activeItem?.label || 'Closer.IA');
  const pageSubtitle = shellContext.isRoot
    ? subtitle || 'Closer.IA'
    : shellContext.subtitle || subtitle || 'Closer.IA';
  // Durante o onboarding, força sidebar expandida no desktop para o fundo aparecer completo
  const sidebarCollapsed = showOnboarding ? false : collapsed;

  const handleHeaderBack = () => {
    if (shellContext.backHref) {
      router.push(shellContext.backHref);
      return;
    }
    router.back();
  };

  return (
    <>
      <div
        className={[
          styles.shell,
          sidebarCollapsed ? styles.shellCollapsed : styles.shellExpanded,
          loggingOut ? styles.shellLoggingOut : '',
        ].filter(Boolean).join(' ')}
      >
        <Sidebar
          items={sidebarItems}
          activeId={activeId}
          collapsed={sidebarCollapsed}
          onToggleCollapse={showOnboarding ? undefined : handleToggleCollapse}
        />

        <div className={styles.mainColumn}>
          <header className={styles.desktopHeader}>
            <div className={styles.desktopHeaderLeft}>
              <h1 className={styles.desktopTitle}>{pageTitle}</h1>
              <span className={styles.desktopSubtitle}>{pageSubtitle}</span>
            </div>
            <div className={styles.desktopHeaderRight}>
              <UserMenu user={user} onLogout={handleLogout} onStartTour={handleStartTour} />
            </div>
          </header>

          <div className={styles.mobileTop}>
            <NavBar
              title={pageTitle}
              subtitle={shellContext.isRoot ? pageSubtitle : null}
              onBack={shellContext.isRoot ? undefined : handleHeaderBack}
              wide
              sticky
              actionRight={<UserMenu user={user} onLogout={handleLogout} onStartTour={handleStartTour} />}
            />
          </div>

          <main className={styles.content}>{children}</main>

          <div className={styles.mobileBottom}>
            <BottomNav
              items={mobilePrimaryItems}
              activeId={isSecondaryActive || moreOpen ? 'mais' : activeId}
              className={styles.fullWidthBottomNav}
              onChange={(id) => {
                if (id === 'mais') {
                  setMoreOpen(true);
                  return;
                }
                const item = getNavItemById(id);
                if (item?.href) router.push(item.href);
              }}
            />
          </div>
        </div>

        <Modal
          isOpen={moreOpen && !showOnboarding && !loggingOut}
          onClose={() => setMoreOpen(false)}
          title="Mais opções"
        >
          <div className={styles.moreGrid}>
            {mobileSecondaryItems.map((item) => {
              const isActive = item.id === activeId;
              return (
                <Link
                  key={item.id}
                  href={item.href}
                  className={[styles.moreItem, isActive ? styles.moreItemActive : '']
                    .filter(Boolean)
                    .join(' ')}
                  onClick={() => setMoreOpen(false)}
                >
                  <span className={styles.moreIcon}>{item.icon}</span>
                  <span className={styles.moreLabel}>{item.label}</span>
                </Link>
              );
            })}
          </div>
        </Modal>

        {showOnboarding && !loggingOut && (
          <OnboardingFlow
            asModal
            initialUser={user}
            onComplete={handleOnboardingComplete}
          />
        )}

        {showTour && !loggingOut && (
          <ProductTour
            open={showTour}
            onClose={() => setShowTour(false)}
          />
        )}
      </div>

      {loggingOut && <LogoutTransition exiting={logoutExiting} />}
    </>
  );
}
