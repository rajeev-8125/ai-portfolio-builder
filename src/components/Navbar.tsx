export default function Navbar() {
  return (
    <header className="navbar">
      <div className="container navbar-inner">
        <div className="logo">
          Portify<span>AI</span>
        </div>

        <nav className="nav-links">
          <a href="#templates">Templates</a>
          <a href="#how-it-works">How It Works</a>
          <a href="#features">Features</a>
          <a href="#pricing">Pricing</a>
        </nav>

        <div className="nav-actions">
          <a href="/login" className="login-btn">
            Login
          </a>

          <a href="/signup" className="nav-cta">
            Get Started
          </a>
        </div>
      </div>
    </header>
  );
}