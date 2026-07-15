import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAgents } from '../context/AgentContext';
import { useAuth } from '../context/AuthContext';
import AuthModal from './AuthModal';
import { LayoutDashboard, Bot, Workflow, Zap, Users, Webhook, Menu, X, LogIn, UserCheck } from 'lucide-react';

export default function Header() {
  const location = useLocation();
  const { stats } = useAgents();
  const { user, configured, signOut } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [showAuth, setShowAuth] = useState(false);

  const navItems = [
    { path: '/', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/agents', label: 'Agents', icon: Bot },
    { path: '/workflows', label: 'Workflows', icon: Workflow },
    { path: '/integrations', label: 'Integrations', icon: Webhook },
  ];

  const closeMenu = () => setMenuOpen(false);

  return (
    <header className="header" role="banner">
      <div className="container nav">
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <Link to="/" className="brand" aria-label="AI Agent Dashboard Home" onClick={closeMenu}>
            <div className="brand-icon" aria-hidden="true" role="img" aria-label="AgentVerse AI logo">
              <img src="/logo.svg" alt="AgentVerse" className="brand-logo-image" />
            </div>
            <span className="brand-text">
              <span className="brand-text-agent">Agent</span>
              <span className="brand-text-verse">Verse</span>
            </span>
          </Link>
          <button
            className="hamburger-btn"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={menuOpen}
          >
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
          <nav aria-label="Main navigation" className={`nav-wrapper ${menuOpen ? 'nav-open' : ''}`}>
            <ul className="nav-links">
              {navItems.map(item => {
                const Icon = item.icon;
                return (
                  <li key={item.path}>
                    <Link
                      to={item.path}
                      className={`nav-link ${location.pathname === item.path ? 'active' : ''}`}
                      aria-current={location.pathname === item.path ? 'page' : undefined}
                      onClick={closeMenu}
                    >
                      <Icon size={16} aria-hidden="true" />
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        </div>

        <div className="header-status">
          <div className="status-badge status-active">
            <Zap size={12} />
            {stats.activeTasks} Active
          </div>
          <div className="status-badge header-agent-count">
            <Users size={12} />
            {stats.totalAgents} Agents
          </div>
          {configured && (
            user ? (
              <button
                className="status-badge"
                onClick={signOut}
                title="Sign out"
                style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
              >
                <UserCheck size={12} style={{ color: '#2ecc71' }} />
                <span style={{ maxWidth: '80px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {user.email}
                </span>
              </button>
            ) : (
              <button
                className="status-badge"
                onClick={() => setShowAuth(true)}
                style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
              >
                <LogIn size={12} />
                Sign In
              </button>
            )
          )}
        </div>
      </div>
      {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
    </header>
  );
}
