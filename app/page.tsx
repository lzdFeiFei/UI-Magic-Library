import Link from "next/link";
import { demos } from "@/lib/demo-registry";

export const dynamic = "force-static";

export default function HomePage() {
  return (
    <main className="page">
      <section className="hero">
        <div className="hero-kicker">UI MAGIC LAB</div>
        <h1 className="hero-title">Interactive UI Demos, ready to configure.</h1>
        <p className="hero-subtitle">
          Browse experimental visuals and open a demo to tweak its controls. Each demo will evolve into a configurable
          module with presets and shareable states.
        </p>
      </section>

      <section className="gallery">
        {demos.map((demo) => (
          <Link className="card" key={demo.slug} href={`/demos/${demo.slug}`}>
            <h2 className="card-title">{demo.title}</h2>
            <p className="card-desc">{demo.description}</p>
            <div className="tag-row">
              {demo.tags.map((tag) => (
                <span className="tag" key={tag}>
                  {tag}
                </span>
              ))}
            </div>
          </Link>
        ))}
      </section>
    </main>
  );
}
