import { Link } from 'react-router-dom';
import { useAuth } from '../components/AuthContext';

export default function Home() {
  const { user } = useAuth();

  return (
    <div className="page">
      <div className="hero">
        <h1>See it. Do it. Teach it. 🌱</h1>
        <p>
          Neighborly connects people who want to teach their skills with those who want to learn — all nearby, all in person.
        </p>
        <div className="cta-row">
          <Link to="/browse" className="btn btn-primary" style={{ background: 'rgba(255,255,255,.25)', color: '#fff' }}>
            🔍 Browse Skills
          </Link>
          {!user && (
            <Link to="/register" className="btn btn-accent">
              🚀 Sign Up Free
            </Link>
          )}
          {user && (
            <Link to="/dashboard" className="btn btn-accent">
              📋 My Dashboard
            </Link>
          )}
        </div>
      </div>

      <div className="card-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))' }}>
        <div className="card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: 10 }}>🎓</div>
          <h3 style={{ marginBottom: 6 }}>Offer a Skill</h3>
          <p style={{ color: 'var(--muted)', fontSize: '.9rem' }}>Share what you know with someone nearby — teach coding, cooking, music, and more.</p>
        </div>
        <div className="card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: 10 }}>🙋</div>
          <h3 style={{ marginBottom: 6 }}>Request to Learn</h3>
          <p style={{ color: 'var(--muted)', fontSize: '.9rem' }}>Find a neighbor who can teach you exactly what you need to learn.</p>
        </div>
        <div className="card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: 10 }}>🤝</div>
          <h3 style={{ marginBottom: 6 }}>Exchange Services</h3>
          <p style={{ color: 'var(--muted)', fontSize: '.9rem' }}>Trade skills — teach Python in exchange for guitar lessons, no money needed.</p>
        </div>
        <div className="card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: 10 }}>📍</div>
          <h3 style={{ marginBottom: 6 }}>Stay Local</h3>
          <p style={{ color: 'var(--muted)', fontSize: '.9rem' }}>Filter by location to find people near you for in-person sessions.</p>
        </div>
      </div>
    </div>
  );
}
