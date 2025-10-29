import React from 'react';
import { useNavigate } from 'react-router-dom';
import ZenLogo from '../components/ZenLogo.jsx';
import { FaKey, FaPen, FaBrain } from 'react-icons/fa';

export default function Home(){
  const nav = useNavigate();
  return (
    <div className="home-page">
      <header className="home-hero">
        {/* animated corner shapes */}
        <div className="bg-shape top-right" aria-hidden></div>
        <div className="bg-shape bottom-left" aria-hidden></div>

        <div className="hero-inner container">
          <div className="hero-left">
            <div style={{display:'flex',alignItems:'center',gap:14}}>
              <ZenLogo size={72} />
              <div>
                <h1 className="site-title">ZenAura Academic Portal <span className="ai-sparkle" aria-hidden>✨</span></h1>
                <p className="tagline">Balance your learning. Grow smarter with AI.</p>
              </div>
            </div>

            <p className="hero-lead">Personalized study plans • AI helper • Role-based dashboards</p>

            <div className="hero-ctas">
              <button className="btn primary hero-btn" onClick={() => nav('/login')}><FaKey style={{marginRight:8}}/> Login</button>
              <button className="btn primary hero-btn alt" onClick={() => nav('/signup')}><FaPen style={{marginRight:8}}/> Sign Up</button>
            </div>
          </div>

          <div className="hero-illustration">
            <img src="/src/assets/placeholder-waves.svg" alt="Illustration" />
          </div>
        </div>
      </header>

      <main className="container about-section">
        <h2>About ZenAura</h2>
        <p className="about-desc">ZenAura helps manage study plans, classrooms, and progress through personalized AI features.
        Our AI assistant recommends study plans and wellness tips so you learn smarter and stay balanced.</p>
        <div className="about-grid">
          <div className="about-card"><div className="card-icon">📚</div><h4>Create Study Plans</h4><p>Build and schedule study plans tailored to your goals.</p></div>
          <div className="about-card"><div className="card-icon">👩‍🏫</div><h4>Join Classrooms</h4><p>Connect with teachers and peers for collaborative learning.</p></div>
          <div className="about-card"><div className="card-icon">📈</div><h4>Track Progress</h4><p>Monitor learning growth with visual analytics and milestones.</p></div>
          <div className="about-card"><div className="card-icon">🧘‍♀️</div><h4>Wellness Insights</h4><p>Get nudges for breaks, reflection, and mindful study habits.</p></div>
        </div>
      </main>

      <footer className="app-footer container">
        <div className="footer-quote">“Learn. Reflect. Grow — with ZenAura 🌸”</div>
        <div className="footer-links">
          <a href="#" className="social pastel">Twitter</a>
          <a href="#" className="social pastel">Contact</a>
        </div>
      </footer>
    </div>
  );
}
