"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MapPin, Search } from "lucide-react";

import { brand, nav } from "@/lib/copy";

// =============================================================================
// SiteHeader — DESIGN_DOC §4.2
// 56px tall, --bg-surface, --border-subtle hairline.
// Wordmark + nav + ⌘K search + Sign in + Subscribe CTA
// =============================================================================

export function SiteHeader() {
  const pathname = usePathname() ?? "/";

  // Treat /map as immersive (no marketing chrome) — but the header still renders
  // because layout sits above. The map shell will overlay edge-to-edge below.

  return (
    <header
      className="sticky top-0 z-40 w-full"
      style={{
        height: 56,
        background: "var(--bg-surface)",
        borderBottom: "1px solid var(--border-subtle)",
      }}
    >
      <div className="mx-auto flex h-full max-w-[1440px] items-center gap-6 px-6">
        {/* Wordmark */}
        <Link
          href="/"
          className="flex items-center gap-1.5 font-semibold"
          style={{ fontSize: 15 }}
        >
          <MapPin
            className="h-3.5 w-3.5"
            strokeWidth={1.75}
            style={{ color: "var(--accent)" }}
          />
          <span style={{ color: "var(--text-primary)" }}>{brand.name}</span>
        </Link>

        {/* Nav links */}
        <nav className="ml-2 hidden items-center gap-1 md:flex">
          {nav.links.map((link) => {
            const isActive =
              link.href === "/"
                ? pathname === "/"
                : pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className="relative rounded-md px-2.5 py-1.5 transition-colors"
                style={{
                  fontSize: 13,
                  fontWeight: 500,
                  color: isActive ? "var(--text-primary)" : "var(--text-secondary)",
                }}
              >
                {link.label}
                {isActive && (
                  <span
                    className="absolute"
                    style={{
                      left: 10,
                      right: 10,
                      bottom: -19,
                      height: 2,
                      background: "var(--accent)",
                    }}
                  />
                )}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-3">
          {/* Search bar (cmd-k stub) */}
          <div
            className="hidden items-center gap-2 lg:flex"
            style={{
              minWidth: 200,
              padding: "5px 10px",
              borderRadius: 8,
              background: "var(--bg-base)",
              border: "1px solid var(--border-default)",
            }}
          >
            <Search className="h-3.5 w-3.5" style={{ color: "var(--text-tertiary)" }} />
            <span style={{ fontSize: 12, color: "var(--text-tertiary)" }}>
              Search
            </span>
            <span className="kbd" style={{ marginLeft: "auto" }}>⌘K</span>
          </div>

          {/* Sign in (ghost) */}
          <Link
            href={nav.signIn.href}
            className="hidden items-center justify-center transition-colors sm:inline-flex"
            style={{
              padding: "6px 10px",
              fontSize: 12,
              fontWeight: 500,
              color: "var(--text-secondary)",
              borderRadius: 8,
            }}
          >
            {nav.signIn.label}
          </Link>

          {/* Subscribe CTA (filled accent) */}
          <Link
            href={nav.cta.href}
            className="inline-flex items-center justify-center transition-colors"
            style={{
              padding: "6px 12px",
              fontSize: 12,
              fontWeight: 600,
              borderRadius: 8,
              background: "var(--accent)",
              color: "var(--text-inverse)",
            }}
          >
            {nav.cta.label}
          </Link>
        </div>
      </div>
    </header>
  );
}
