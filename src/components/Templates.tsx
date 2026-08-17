const templates = [
  {
    name: "Minimal",
    description: "Clean and simple portfolio for professionals.",
    className: "template-minimal",
  },
  {
    name: "Developer",
    description: "Modern portfolio designed for software developers.",
    className: "template-developer",
  },
  {
    name: "Professional",
    description: "Corporate and recruiter-friendly portfolio.",
    className: "template-professional",
  },
];

export default function Templates() {
  return (
    <section id="templates" className="section templates-section">
      <div className="container">
        <div className="section-heading">
          <span>PORTFOLIO TEMPLATES</span>

          <h2>Choose a design that fits you.</h2>

          <p>
            Start with a template and customize it with your own
            design instructions.
          </p>
        </div>

        <div className="templates-grid">
          {templates.map((template) => (
            <div className="template-card" key={template.name}>
              <div className={`template-preview ${template.className}`}>
                <div className="mock-navbar"></div>

                <div className="mock-hero"></div>

                <div className="mock-text"></div>

                <div className="mock-text small"></div>

                <div className="mock-projects">
                  <div></div>
                  <div></div>
                  <div></div>
                </div>
              </div>

              <div className="template-info">
                <h3>{template.name}</h3>

                <p>{template.description}</p>

                <button>Preview Template</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}