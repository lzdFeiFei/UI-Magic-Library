"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import ControlsPanel from "./ControlsPanel";
import { demoComponents } from "../components/demo-components";
import type { DemoMeta } from "@/lib/demo-registry";

type Props = {
  demo: DemoMeta;
};

export default function ClientDemoShell({ demo }: Props) {
  const [config, setConfig] = useState<Record<string, string | number | boolean>>(demo.defaultConfig ?? {});

  const DemoComponent = useMemo(() => demoComponents[demo.slug], [demo.slug]);

  return (
    <main className="demo-page">
      <aside className="sidebar">
        <Link href="/">← Back to gallery</Link>
        <div className="demo-header">
          <h2>{demo.title}</h2>
          <p className="card-desc">{demo.description}</p>
        </div>
        <ControlsPanel demo={demo} config={config} onChange={setConfig} />
      </aside>

      <section className="demo-shell">
        <div className="demo-header">
          <h1>{demo.title}</h1>
          <p className="hero-subtitle">{demo.description}</p>
        </div>
        <div className="demo-frame">
          {DemoComponent ? (
            <DemoComponent config={config} />
          ) : (
            <div className="demo-stage demo-fallback">Demo component not available.</div>
          )}
        </div>
      </section>
    </main>
  );
}
