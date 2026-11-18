/**
 * Owns the persistent navigation, domain filter, global search, and theme
 * preference for OpsIntel. Route content receives shared search and filter context.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useGetDomainsQuery } from '../../api/opsApi';
import Dropdown from '../../components/Dropdown/Dropdown';

export interface ShellContext {
  search: string;
  domain: string;
  applicationsView: 'grid' | 'table';
  setApplicationsView: (view: 'grid' | 'table') => void;
  gridFullscreen: boolean;
  setGridFullscreen: (fullscreen: boolean) => void;
}

/** Renders the platform frame and maintains user-selectable global context. */
export default function OperationsShell() {
  const location = useLocation();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [domain, setDomain] = useState('All domains');
  const [applicationsView, setApplicationsView] = useState<'grid' | 'table'>('grid');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const routeState = location.state;
  const gridFullscreen = location.pathname === '/'
    && typeof routeState === 'object'
    && routeState !== null
    && 'gridFullscreen' in routeState
    && routeState.gridFullscreen === true;
  const setGridFullscreen = useCallback((active: boolean) => {
    navigate('/', { replace: location.pathname === '/', state: active ? { gridFullscreen: true } : null });
  }, [location.pathname, navigate]);
  const { data: domains = [] } = useGetDomainsQuery();
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = window.localStorage.getItem('opsintel-theme');
    if (saved === 'light' || saved === 'dark') return saved;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const timeout = window.setTimeout(() => setSearch(searchInput), 300);
    return () => window.clearTimeout(timeout);
  }, [searchInput]);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    window.localStorage.setItem('opsintel-theme', theme);
  }, [theme]);

  useEffect(() => {
    if (!gridFullscreen) return undefined;
    function exitFullscreen(event: KeyboardEvent) {
      if (event.key === 'Escape') setGridFullscreen(false);
    }
    window.addEventListener('keydown', exitFullscreen);
    return () => window.removeEventListener('keydown', exitFullscreen);
  }, [gridFullscreen, setGridFullscreen]);

  useEffect(() => {
    if (location.pathname === '/' && location.hash === '#active-incidents') {
      document.getElementById('active-incidents')?.scrollIntoView();
    }
  }, [location.hash, location.pathname]);

  useEffect(() => {
    function focusSearch(event: KeyboardEvent) {
      if (event.key !== '/' || event.ctrlKey || event.metaKey || event.altKey) return;
      const target = event.target;
      if (target instanceof HTMLElement && (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName))) return;
      event.preventDefault();
      searchRef.current?.focus();
    }
    window.addEventListener('keydown', focusSearch);
    return () => window.removeEventListener('keydown', focusSearch);
  }, []);

  const context: ShellContext = {
    search,
    domain,
    applicationsView,
    setApplicationsView,
    gridFullscreen,
    setGridFullscreen,
  };

  return (
    <div className={`ops-app${gridFullscreen ? ' is-grid-fullscreen' : ''}${sidebarCollapsed ? ' is-sidebar-collapsed' : ''}`}>
      <a className="skip-link" href="#main-content">Skip to main content</a>
      <aside className="sidebar" aria-label="Primary navigation">
        <div className="sidebar-header">
          <NavLink to="/" className="brand-lockup" aria-label="WOS health overview">
            <span className="brand-mark" aria-hidden="true">W</span>
            <span className="brand-copy"><strong>WOS</strong><small>WALL OF STABILITY</small></span>
          </NavLink>
          <button
            type="button"
            className="sidebar-toggle"
            aria-label={sidebarCollapsed ? 'Expand navigation' : 'Collapse navigation'}
            aria-expanded={!sidebarCollapsed}
            title={sidebarCollapsed ? 'Expand navigation' : 'Collapse navigation'}
            onClick={() => setSidebarCollapsed((collapsed) => !collapsed)}
          >
            <span aria-hidden="true">{sidebarCollapsed ? '›' : '‹'}</span>
          </button>
        </div>
        <div className="nav-section-label">MONITOR</div>
        <nav className="primary-nav" aria-label="Monitor">
          <NavLink
            to="/"
            end
            aria-label={sidebarCollapsed ? 'Dashboard' : undefined}
            title={sidebarCollapsed ? 'Dashboard' : undefined}
            className={() => `nav-link${location.pathname === '/' && location.hash !== '#active-incidents' ? ' is-active' : ''}`}
          >
            <span className="nav-icon" aria-hidden="true">◫</span>
            <span className="nav-label">Dashboard</span>
          </NavLink>
          <NavLink
            to="/#active-incidents"
            aria-label={sidebarCollapsed ? 'Incidents' : undefined}
            title={sidebarCollapsed ? 'Incidents' : undefined}
            className={() => `nav-link${location.pathname === '/' && location.hash === '#active-incidents' ? ' is-active' : ''}`}
          >
            <span className="nav-icon" aria-hidden="true">⌁</span>
            <span className="nav-label">Incidents</span>
          </NavLink>
         
          <button
            type="button"
            className="nav-link fullscreen-nav-action"
            aria-label="Open full-screen application view"
            title="Open full-screen application view"
            onClick={() => {
              setApplicationsView('grid');
              if (location.pathname === '/') {
                setGridFullscreen(true);
              } else {
                setGridFullscreen(true);
              }
            }}
          >
            <span className="nav-icon" aria-hidden="true">⛶</span><span className="nav-label">Applications</span>
          </button>
        </nav>
        <div className="nav-section-label nav-section-spaced">MANAGE</div>
        <nav className="primary-nav" aria-label="Manage">
          <NavLink
            to="/onboard"
            aria-label={sidebarCollapsed ? 'Onboarding' : undefined}
            title={sidebarCollapsed ? 'Onboarding' : undefined}
            className={({ isActive }) => `nav-link${isActive ? ' is-active' : ''}`}
          >
            <span className="nav-icon" aria-hidden="true">+</span>
            <span className="nav-label">Onboarding</span>
          </NavLink>
          <NavLink
            to="/domains"
            aria-label={sidebarCollapsed ? 'Domains' : undefined}
            title={sidebarCollapsed ? 'Domains' : undefined}
            className={({ isActive }) => `nav-link${isActive ? ' is-active' : ''}`}
          >
            <span className="nav-icon" aria-hidden="true">◇</span>
            <span className="nav-label">Domains</span>
          </NavLink>
        </nav>
        <div className="sidebar-bottom">
          <div className="workspace-status"><span className="status-dot" /><span></span></div>
          <div className="user-profile">
            <span className="avatar">JM</span>
            <span className="user-copy"><strong>Jordan Miller</strong><small>Platform admin</small></span>
            <button className="icon-button profile-menu" type="button" aria-label="Open profile menu">···</button>
          </div>
        </div>
      </aside>

      <div className="main-column">
        <header className="topbar">
          <div className="global-controls">
            <Dropdown
              ariaLabel="Filter by domain"
              value={domain}
              onChange={setDomain}
              options={[{ value: 'All domains', label: 'All domains' }, ...domains.map((item) => ({ value: item.domainName, label: item.domainName }))]}
              className="domain-dropdown"
            />
          </div>
          <label className="global-search">
            <span aria-hidden="true">⌕</span>
            <span className="sr-only">Search applications</span>
            <input ref={searchRef} value={searchInput} onChange={(event) => setSearchInput(event.target.value)} placeholder="Search applications..." />
            <kbd>/</kbd>
          </label>
          <div className="topbar-actions">
            <button
              type="button"
              className="icon-button theme-toggle"
              aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} theme`}
              onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
            >{theme === 'light' ? '◐' : '☼'}</button>
            <NavLink className="button button-primary top-onboard" to="/onboard"><span aria-hidden="true">+</span> Onboard application</NavLink>
          </div>
        </header>
        <main id="main-content" className="page-content">
          <Outlet context={context} />
        </main>
      </div>
    </div>
  );
}