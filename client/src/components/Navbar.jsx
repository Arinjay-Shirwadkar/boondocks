import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const FONT_FAMILY = '"Comic Sans MS", "Comic Sans", cursive, sans-serif';

export default function Navbar() {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
    setMobileMenuOpen(false);
  };

  const navLinkStyle = ({ isActive }) =>
    `px-3 py-2 text-sm font-black uppercase tracking-wider transition-colors border-2 ${
      isActive
        ? 'bg-[#DC143C] text-[#FFFDD0] border-[#FFFDD0] shadow-[3px_3px_0_#FFFDD0]'
        : 'text-[#FFFDD0] border-transparent hover:border-[#DC143C] hover:text-[#DC143C]'
    }`;

  const isHost = user?.role === 'host' || user?.role === 'both';
  const isSeeker = user?.role === 'seeker' || user?.role === 'both' || !user?.role;

  return (
    <header
      className="sticky top-0 z-40 w-full border-b-4 border-[#DC143C] bg-[#000000] text-[#FFFDD0]"
      style={{ fontFamily: FONT_FAMILY }}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <Link
            to={isAuthenticated ? (user?.role === 'host' ? '/host' : '/matches') : '/'}
            className="text-2xl sm:text-3xl font-black uppercase tracking-widest text-[#DC143C] hover:text-[#FFFDD0] transition-colors"
          >
            Boondocks
          </Link>
          <span className="hidden md:inline-block border-2 border-[#DC143C] px-2 py-0.5 text-xs font-bold uppercase text-[#FFFDD0]">
            Exclusive Sharing
          </span>
        </div>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-2 lg:gap-4">
          {isAuthenticated ? (
            <>
              {isSeeker && (
                <>
                  <NavLink to="/matches" className={navLinkStyle}>
                    Matches
                  </NavLink>
                  <NavLink to="/requested" className={navLinkStyle}>
                    Requests
                  </NavLink>
                </>
              )}

              {isHost && (
                <NavLink to="/host" className={navLinkStyle}>
                  Host Dashboard
                </NavLink>
              )}

              <NavLink to="/profile" className={navLinkStyle}>
                Profile
              </NavLink>

              {/* User indicator & Logout */}
              <div className="ml-2 flex items-center gap-3 border-l-2 border-[#DC143C] pl-4">
                <div className="text-right text-xs">
                  <p className="font-bold text-[#FFFDD0] truncate max-w-[120px]">{user?.name || 'User'}</p>
                  <p className="text-[10px] uppercase font-bold text-[#DC143C]">{user?.role || 'Seeker'}</p>
                </div>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="border-2 border-[#DC143C] bg-[#000000] px-3 py-1.5 text-xs font-black uppercase tracking-wider text-[#FFFDD0] shadow-[3px_3px_0_#DC143C] hover:bg-[#DC143C] hover:shadow-[3px_3px_0_#FFFDD0] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
                >
                  Logout
                </button>
              </div>
            </>
          ) : (
            <>
              <NavLink to="/" className={navLinkStyle}>
                Home
              </NavLink>
              <NavLink to="/login" className={navLinkStyle}>
                Log In
              </NavLink>
              <Link
                to="/signup"
                className="ml-2 border-2 border-[#FFFDD0] bg-[#DC143C] px-4 py-2 text-xs font-black uppercase tracking-wider text-[#FFFDD0] shadow-[3px_3px_0_#FFFDD0] hover:bg-[#8B0000] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
              >
                Sign Up
              </Link>
            </>
          )}
        </nav>

        {/* Mobile menu button */}
        <div className="flex md:hidden items-center gap-2">
          {isAuthenticated && (
            <span className="text-xs font-bold text-[#DC143C] uppercase truncate max-w-[90px]">
              {user?.name}
            </span>
          )}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="border-2 border-[#DC143C] bg-black p-2 font-bold text-[#FFFDD0] hover:bg-[#DC143C]"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? '✕' : '☰'}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="border-t-4 border-[#DC143C] bg-[#000000] px-4 py-4 md:hidden flex flex-col gap-3">
          {isAuthenticated ? (
            <>
              {isSeeker && (
                <>
                  <NavLink
                    to="/matches"
                    onClick={() => setMobileMenuOpen(false)}
                    className={navLinkStyle}
                  >
                    Matches
                  </NavLink>
                  <NavLink
                    to="/requested"
                    onClick={() => setMobileMenuOpen(false)}
                    className={navLinkStyle}
                  >
                    Requests
                  </NavLink>
                </>
              )}

              {isHost && (
                <NavLink
                  to="/host"
                  onClick={() => setMobileMenuOpen(false)}
                  className={navLinkStyle}
                >
                  Host Dashboard
                </NavLink>
              )}

              <NavLink
                to="/profile"
                onClick={() => setMobileMenuOpen(false)}
                className={navLinkStyle}
              >
                Profile
              </NavLink>

              <button
                type="button"
                onClick={handleLogout}
                className="mt-2 w-full border-2 border-[#DC143C] bg-[#DC143C] py-2 text-sm font-black uppercase tracking-wider text-[#FFFDD0] shadow-[4px_4px_0_#FFFDD0]"
              >
                Logout ({user?.name})
              </button>
            </>
          ) : (
            <>
              <NavLink
                to="/"
                onClick={() => setMobileMenuOpen(false)}
                className={navLinkStyle}
              >
                Home
              </NavLink>
              <NavLink
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className={navLinkStyle}
              >
                Log In
              </NavLink>
              <Link
                to="/signup"
                onClick={() => setMobileMenuOpen(false)}
                className="border-2 border-[#FFFDD0] bg-[#DC143C] py-2.5 text-center text-sm font-black uppercase tracking-wider text-[#FFFDD0] shadow-[4px_4px_0_#FFFDD0]"
              >
                Sign Up
              </Link>
            </>
          )}
        </div>
      )}
    </header>
  );
}

