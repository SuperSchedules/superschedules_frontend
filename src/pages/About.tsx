import './About.css';

interface AboutProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function About({ isOpen, onClose }: AboutProps) {
  if (!isOpen) return null;

  return (
    <div className="about-overlay" onClick={onClose}>
      <div className="about-modal" onClick={(e) => e.stopPropagation()}>
        <div className="about-header">
          <h2>About EventZombie</h2>
          <button className="close-btn" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>
        <div className="about-content">
          <p>
            <strong>EventZombie</strong> is an AI-assisted event discovery and planning tool. It's being built as a showcase project to demonstrate how quickly a full-stack product can be developed with modern frameworks and AI coding tools like Claude Code CLI and GitHub Copilot.
          </p>

          <h3>Vision</h3>
          <ul>
            <li><strong>Chat-powered search</strong>: Use a natural language interface (powered by LLMs) to find things to do in your area or where you plan to go.</li>
            <li><strong>User-submitted sources</strong>: Users can suggest websites or locations to scan for events, which will be scraped and structured automatically.</li>
            <li><strong>Persistent discovery</strong>: Events will be continuously updated and stored, enabling both push (recommendations) and pull (search) interactions.</li>
          </ul>

          <h3>Tech Stack</h3>
          <ul>
            <li><strong>Frontend:</strong> Vite + React + React Router</li>
            <li><strong>Backend:</strong> Django + FastAPI (streaming chat) + Django Ninja (REST API)</li>
            <li><strong>Database:</strong> PostgreSQL with pgvector for semantic search</li>
            <li><strong>Auth:</strong> Access/Refresh token-based JWT (ninja-jwt)</li>
            <li><strong>AI:</strong> AWS Bedrock (Claude 3 Haiku) for chat, RAG with sentence transformers</li>
            <li><strong>Infrastructure:</strong> AWS (EC2, ALB, RDS, S3) with Terraform blue/green deployments</li>
            <li><strong>Services:</strong> Navigator (event site location discovery), Collector (event scraping & enrichment)</li>
          </ul>

          <h3>Development Philosophy</h3>
          <p>
            This project is being developed rapidly using Claude Code CLI as the primary development assistant, with support from GitHub Copilot. The focus is on clarity, modularity, and realistic product evolution. It demonstrates how human + AI workflows can accelerate real software delivery from concept to production.
          </p>
        </div>
      </div>
    </div>
  );
}

