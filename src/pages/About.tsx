import './About.css';

export default function About() {
  return (
    <div className="about-page">
      <h1>About Superschedules</h1>

      <p>
        <strong>Superschedules</strong> is an AI-assisted event discovery and planning tool. It’s being built as a showcase project to demonstrate how quickly a full-stack product can be developed with modern frameworks and tools like ChatGPT and GitHub Copilot/Codex.
      </p>

      <h2>Vision</h2>
      <ul>
        <li><strong>Chat-powered search</strong>: Use a natural language interface (powered by LLMs) to find things to do in your area or where you plan to go.</li>
        <li><strong>User-submitted sources</strong>: Users can suggest websites or locations to scan for events, which will be scraped and structured automatically.</li>
        <li><strong>Persistent discovery</strong>: Events will be continuously updated and stored, enabling both push (recommendations) and pull (search) interactions.</li>
      </ul>

      <h2>Tech Stack</h2>
      <ul>
        <li><strong>Frontend:</strong> Vite + React + React Router</li>
        <li><strong>Backend:</strong> Django + Django Ninja + JWT Auth (ninja-jwt)</li>
        <li><strong>Database:</strong> PostgreSQL</li>
        <li><strong>Auth:</strong> Access/Refresh token-based JWT login flow</li>
        <li><strong>Infrastructure:</strong> Terraform-managed, designed for deployment on AWS (EC2, RDS, S3, etc.)</li>
        <li><strong>AI & Scraping:</strong> Separate microservices (planned) to handle scraping, enrichment, and chat integration</li>
      </ul>

      <h2>Repositories</h2>
      <ul>
        <li><code>superschedules_frontend</code>: React-based SPA</li>
        <li><code>superschedules</code>: Django API backend</li>
        <li><code>superschedules_IAC</code>: Infrastructure-as-Code using Terraform</li>
        <li><code>superschedules_collector</code> (planned): Event scraper & enrichment system using LLMs and/or structured parsers</li>
      </ul>

      <h2>Development Philosophy</h2>
      <p>
        This project is being developed fast, with a focus on clarity, modularity, and realistic product evolution. It’s built to be extended and demonstrates how human + AI workflows can accelerate real software delivery.
      </p>
    </div>
  );
}

