export default function Hero() {
  return (
    <section className="hero">
      <div className="container hero-grid">
        <div className="hero-content">
          <div className="hero-badge">
            AI-powered portfolio builder
          </div>

          <h1>
            Turn your resume into a
            <span> professional portfolio.</span>
          </h1>

          <p>
            Upload your resume, choose a design, describe how you want
            your website to look, and publish your portfolio in minutes.
          </p>

          <div className="hero-buttons">
            <a href="/signup" className="primary-btn">
              Create My Portfolio
            </a>

            <a href="#templates" className="secondary-btn">
              Explore Templates
            </a>
          </div>

          <div className="hero-points">
            <span>✓ AI Generated</span>
            <span>✓ Multiple Templates</span>
            <span>✓ Public Portfolio Link</span>
          </div>
        </div>

        <div className="hero-preview">
          <div className="preview-window">
            <div className="preview-top">
              <span></span>
              <span></span>
              <span></span>
            </div>

            <div className="preview-content">
              <div className="preview-avatar"></div>

              <div className="preview-line large"></div>
              <div className="preview-line"></div>
              <div className="preview-line short"></div>

              <div className="preview-buttons">
                <div></div>
                <div></div>
              </div>

              <div className="preview-cards">
                <div></div>
                <div></div>
                <div></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}