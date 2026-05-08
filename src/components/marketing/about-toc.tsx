"use client";

import { useEffect, useState } from "react";

export function AboutTOC({
  sections,
}: {
  sections: { id: string; label: string }[];
}) {
  const [active, setActive] = useState(sections[0]?.id ?? "");

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort(
            (a, b) =>
              a.target.getBoundingClientRect().top -
              b.target.getBoundingClientRect().top,
          );
        if (visible[0]) setActive(visible[0].target.id);
      },
      { rootMargin: "-80px 0px -60% 0px", threshold: 0 },
    );

    sections.forEach((s) => {
      const el = document.getElementById(s.id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [sections]);

  return (
    <nav
      style={{
        position: "sticky",
        top: 80,
        paddingLeft: 16,
        borderLeft: "1px solid var(--border-subtle)",
      }}
      aria-label="On-page navigation"
    >
      <div
        className="t-cap t-up"
        style={{ marginBottom: 12, color: "var(--text-tertiary)" }}
      >
        On this page
      </div>
      <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
        {sections.map((s) => (
          <li key={s.id} style={{ marginBottom: 8 }}>
            <a
              href={`#${s.id}`}
              style={{
                fontSize: 13,
                color:
                  active === s.id
                    ? "var(--text-primary)"
                    : "var(--text-secondary)",
                fontWeight: active === s.id ? 500 : 400,
                textDecoration: "none",
              }}
            >
              {s.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
