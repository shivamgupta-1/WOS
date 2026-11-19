/**
 * Owns persistent navigation and theme preference for OpsIntel.
 */
import {
  Globe2,
  LayoutDashboard,
  Moon,
  PanelsTopLeft,
  Plus,
  Sun,
} from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { Topbar } from '../../components/ui/Topbar';

export interface ShellContext {
  applicationsView: 'grid' | 'table';
  setApplicationsView: (view: 'grid' | 'table') => void;
  gridFullscreen: boolean;
}

/** Renders the shared platform frame and maintains the selected theme. */
export default function OperationsShell() {
  const location = useLocation();
  const navigate = useNavigate();
  const [applicationsView, setApplicationsView] = useState<'grid' | 'table'>('table');
  const routeState = location.state;
  const gridFullscreen = location.pathname === '/'
    && typeof routeState === 'object'
    && routeState !== null
    && 'gridFullscreen' in routeState
    && routeState.gridFullscreen === true;
  const setGridFullscreen = useCallback((active: boolean) => {
    navigate('/', { replace: location.pathname === '/', state: active ? { gridFullscreen: true } : null });
  }, [location.pathname, navigate]);
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = window.localStorage.getItem('opsintel-theme');
    if (saved === 'light' || saved === 'dark') return saved;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });
  const applicationsNavigationRef = useRef<HTMLAnchorElement>(null);
  const focusApplicationsNavigation = useCallback(() => {
    applicationsNavigationRef.current?.focus();
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    window.localStorage.setItem('opsintel-theme', theme);
  }, [theme]);

  useEffect(() => {
    if (!gridFullscreen) return undefined;
    function exitFullscreen(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setGridFullscreen(false);
        focusApplicationsNavigation();
      }
    }
    window.addEventListener('keydown', exitFullscreen);
    return () => window.removeEventListener('keydown', exitFullscreen);
  }, [gridFullscreen, setGridFullscreen, focusApplicationsNavigation]);

  const context: ShellContext = {
    applicationsView,
    setApplicationsView,
    gridFullscreen,
  };

  return (
    <div className={`ops-app app-shell${gridFullscreen ? ' is-grid-fullscreen' : ''}`}>
      <a className="skip-link" href="#main-content">Skip to main content</a>
      <div className="app-main">
        <Topbar
          className="app-topbar"
          leading={(
            <Link to="/" className="app-brand" aria-label="WOS health overview">
              <span className="app-brand-mark" aria-hidden="true">W</span>
              <span className="app-brand-copy"><strong>WOS</strong><small>WALL OF STABILITY</small></span>
            </Link>
          )}
          navigation={(
            <nav className="app-primary-nav" aria-label="Primary navigation">
              <Link
                ref={applicationsNavigationRef}
                to="/"
                state={{ gridFullscreen: true }}
                aria-current={gridFullscreen ? 'page' : undefined}
                className={`app-top-nav-link${gridFullscreen ? ' is-active' : ''}`}
                onClick={() => setApplicationsView('grid')}
              >
                <PanelsTopLeft aria-hidden="true" />
                <span>Applications</span>
              </Link>
              <Link
                to="/"
                aria-current={location.pathname === '/' && !gridFullscreen ? 'page' : undefined}
                className={`app-top-nav-link${location.pathname === '/' && !gridFullscreen ? ' is-active' : ''}`}
              >
                <LayoutDashboard aria-hidden="true" />
                <span>Dashboard</span>
              </Link>
              <Link
                to="/onboard"
                aria-current={location.pathname === '/onboard' ? 'page' : undefined}
                className={`app-top-nav-link${location.pathname === '/onboard' ? ' is-active' : ''}`}
              >
                <Plus aria-hidden="true" />
                <span>Onboarding</span>
              </Link>
              <Link
                to="/domains"
                aria-current={location.pathname === '/domains' ? 'page' : undefined}
                className={`app-top-nav-link${location.pathname === '/domains' ? ' is-active' : ''}`}
              >
                <Globe2 aria-hidden="true" />
                <span>Domains</span>
              </Link>
            </nav>
          )}
          actions={(
            <Button
              className="app-theme-toggle"
              variant="ghost"
              size="sm"
              aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} theme`}
              onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
              leadingIcon={theme === 'light'
                ? <Moon aria-hidden="true" className="size-4" />
                : <Sun aria-hidden="true" className="size-4" />}
            />
          )}
        />
        <main id="main-content" className="app-page-content" tabIndex={-1}>
          <Outlet context={context} />
        </main>
      </div>
    </div>
  );
}
