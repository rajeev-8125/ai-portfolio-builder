const steps = [
  {
    number: "01",
    title: "Upload your resume",
    description:
      "Upload your existing PDF or DOCX resume. Our system extracts your professional information.",
  },
  {
    number: "02",
    title: "Choose your design",
    description:
      "Select from professional portfolio templates or describe the design you want.",
  },
  {
    number: "03",
    title: "Publish your portfolio",
    description:
      "Review your portfolio, make changes, and publish it with a shareable public link.",
  },
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="section">
      <div className="container">
        <div className="section-heading">
          <span>HOW IT WORKS</span>

          <h2>From resume to portfolio in three steps.</h2>

          <p>
            No coding required. Your resume becomes the foundation
            of your professional website.
          </p>
        </div>

        <div className="steps-grid">
          {steps.map((step) => (
            <div className="step-card" key={step.number}>
              <div className="step-number">{step.number}</div>

              <h3>{step.title}</h3>

              <p>{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}