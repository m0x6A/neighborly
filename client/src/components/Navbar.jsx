import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/');
  }

  return (
    <nav>
      <Link to="/" className="brand">🏘️ Neighborly</Link>
      <Link to="/browse">Browse Skills</Link>
      {user && <Link to="/dashboard">My Dashboard</Link>}
      <span className="spacer" />
      {user ? (
        <>
          <Link to="/profile" className="nav-btn">👤 {user.name}</Link>
          <button className="nav-btn" onClick={handleLogout}>Log out</button>
        </>
      ) : (
        <>
          <Link to="/login" className="nav-btn">Log in</Link>
          <Link to="/register" className="nav-btn" style={{ background: 'rgba(255,255,255,.3)' }}>Sign up</Link>
        </>
      )}
    </nav>
  );
}
