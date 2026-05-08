"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Heart, LogOut, MapPin, Menu, Search } from "lucide-react";

import { brand, nav } from "@/lib/copy";
import { getSupabaseClient } from "@/lib/supabase/client";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

// =============================================================================
// SiteHeader — DESIGN_DOC §4.2
// 56px tall, --bg-surface, --border-subtle hairline.
// Wordmark + nav + ⌘K search + Sign in + Subscribe CTA
// =============================================================================

const SUPPORT_HREF = "/support";

export function SiteHeader() {
  const pathname = usePathname() ?? "/";
  const router = useRouter();

  // Support gets its own slot in the top-right; exclude it from the main nav lists.
  const primaryLinks = nav.links.filter((l) => l.href !== SUPPORT_HREF);
  const supportLink = nav.links.find((l) => l.href === SUPPORT_HREF);
  const isSupportActive = !!supportLink && pathname.startsWith(SUPPORT_HREF);

  // Auth state — drives Sign in / Sign out swap, hides the "Sign up free"
  // CTA for authenticated users, and exposes the Admin link for approved
  // admins.
  const [authed, setAuthed] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  useEffect(() => {
    const supabase = getSupabaseClient();
    if (!supabase) return;
    let cancelled = false;
    async function refresh() {
      const { data } = await supabase!.auth.getSession();
      const has = !!data.session;
      if (cancelled) return;
      setAuthed(has);
      if (!has) { setIsAdmin(false); return; }
      const { data: grant } = await supabase!
        .from("admin_grants")
        .select("user_id")
        .eq("user_id", data.session!.user.id)
        .is("revoked_at", null)
        .maybeSingle();
      if (!cancelled) setIsAdmin(!!grant);
    }
    refresh();
    const { data: { subscription } } = supabase.auth.onAuthStateChange(refresh);
    return () => { cancelled = true; subscription.unsubscribe(); };
  }, []);

  async function handleSignOut() {
    const supabase = getSupabaseClient();
    if (!supabase) return;
    await supabase.auth.signOut();
    setAuthed(false);
    router.push("/");
  }

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
      <div className="mx-auto flex h-full max-w-[1440px] items-center gap-3 px-4 md:gap-6 md:px-6">
        {/* Mobile drawer trigger */}
        <Sheet>
          <SheetTrigger
            className="inline-flex h-9 w-9 items-center justify-center rounded-md md:hidden"
            style={{ color: "var(--text-primary)" }}
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" strokeWidth={1.75} />
          </SheetTrigger>

          <SheetContent
            side="left"
            className="flex w-72 flex-col gap-0 p-0"
            style={{
              background: "var(--bg-surface)",
              borderRight: "1px solid var(--border-subtle)",
            }}
          >
            <div
              className="flex items-center px-5"
              style={{
                height: 56,
                borderBottom: "1px solid var(--border-subtle)",
              }}
            >
              <SheetClose
                render={
                  <Link
                    href="/"
                    className="flex items-center gap-1.5 font-semibold"
                    style={{ fontSize: 15 }}
                  />
                }
              >
                <MapPin
                  className="h-3.5 w-3.5"
                  strokeWidth={1.75}
                  style={{ color: "var(--accent)" }}
                />
                <SheetTitle
                  render={<span style={{ color: "var(--text-primary)" }} />}
                >
                  {brand.name}
                </SheetTitle>
              </SheetClose>
            </div>

            <nav className="flex flex-col gap-0.5 px-3 py-4">
              {primaryLinks.map((link) => {
                const isActive =
                  link.href === "/"
                    ? pathname === "/"
                    : pathname.startsWith(link.href);
                return (
                  <SheetClose
                    key={link.href}
                    render={
                      <Link
                        href={link.href}
                        className="rounded-md px-3 py-2.5 transition-colors"
                        style={{
                          fontSize: 14,
                          fontWeight: 500,
                          color: isActive
                            ? "var(--text-primary)"
                            : "var(--text-secondary)",
                          background: isActive
                            ? "var(--bg-base)"
                            : "transparent",
                        }}
                      />
                    }
                  >
                    {link.label}
                  </SheetClose>
                );
              })}
            </nav>

            {isAdmin && (
              <div
                className="flex flex-col gap-0.5 px-3 py-3"
                style={{ borderTop: "1px solid var(--border-subtle)" }}
              >
                <div
                  className="t-cap t-up px-3"
                  style={{
                    fontSize: 11,
                    color: "var(--text-tertiary)",
                    marginBottom: 4,
                  }}
                >
                  Admin
                </div>
                {[
                  { href: "/admin/queue",    label: "Moderation queue" },
                  { href: "/admin/grants",   label: "Approve admins" },
                  { href: "/admin/submit",   label: "Add a case" },
                  { href: "/admin/cookbook", label: "Cookbook" },
                ].map((a) => (
                  <SheetClose
                    key={a.href}
                    render={
                      <Link
                        href={a.href}
                        className="rounded-md px-3 py-2 transition-colors"
                        style={{
                          fontSize: 13,
                          fontWeight: 500,
                          color: pathname.startsWith(a.href)
                            ? "var(--text-primary)"
                            : "var(--text-secondary)",
                          background: pathname.startsWith(a.href)
                            ? "var(--bg-base)"
                            : "transparent",
                        }}
                      />
                    }
                  >
                    {a.label}
                  </SheetClose>
                ))}
              </div>
            )}

            <div
              className="mt-auto flex flex-col gap-2 px-3 py-4"
              style={{ borderTop: "1px solid var(--border-subtle)" }}
            >
              {authed ? (
                <SheetClose
                  render={
                    <button
                      type="button"
                      onClick={handleSignOut}
                      className="inline-flex items-center justify-center gap-1.5 rounded-md transition-colors"
                      style={{
                        padding: "10px 12px",
                        fontSize: 13,
                        fontWeight: 500,
                        color: "var(--text-secondary)",
                        background: "transparent",
                        border: "1px solid var(--border-default)",
                        cursor: "pointer",
                      }}
                    />
                  }
                >
                  <LogOut className="h-3.5 w-3.5" strokeWidth={1.75} />
                  Sign out
                </SheetClose>
              ) : (
                <>
                  <SheetClose
                    render={
                      <Link
                        href={nav.signIn.href}
                        className="rounded-md px-3 py-2.5 transition-colors"
                        style={{
                          fontSize: 13,
                          fontWeight: 500,
                          color: "var(--text-secondary)",
                        }}
                      />
                    }
                  >
                    {nav.signIn.label}
                  </SheetClose>
                  <SheetClose
                    render={
                      <Link
                        href={nav.cta.href}
                        className="inline-flex items-center justify-center rounded-md transition-colors"
                        style={{
                          padding: "10px 12px",
                          fontSize: 13,
                          fontWeight: 600,
                          background: "var(--accent)",
                          color: "var(--text-inverse)",
                        }}
                      />
                    }
                  >
                    {nav.cta.label}
                  </SheetClose>
                </>
              )}
            </div>
          </SheetContent>
        </Sheet>

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
          {primaryLinks.map((link) => {
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
          {/* Support — pulled out of main nav, always visible */}
          {supportLink && (
            <Link
              href={supportLink.href}
              className="inline-flex items-center justify-center gap-1.5 transition-colors"
              style={{
                padding: "6px 10px",
                fontSize: 12,
                fontWeight: 500,
                color: isSupportActive
                  ? "var(--text-primary)"
                  : "var(--text-secondary)",
                borderRadius: 8,
              }}
            >
              <Heart
                className="h-3.5 w-3.5"
                strokeWidth={1.75}
                style={{ color: "var(--accent)" }}
              />
              {supportLink.label}
            </Link>
          )}

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

          {/* Admin nav — only for approved admins. Quick access to the two
              top-of-funnel admin tasks. */}
          {isAdmin && (
            <>
              <Link
                href="/admin/queue"
                className="hidden items-center justify-center transition-colors sm:inline-flex"
                style={{
                  padding: "6px 10px",
                  fontSize: 12,
                  fontWeight: 500,
                  color: pathname.startsWith("/admin/queue")
                    ? "var(--text-primary)"
                    : "var(--text-secondary)",
                  borderRadius: 8,
                }}
              >
                Queue
              </Link>
              <Link
                href="/admin/grants"
                className="hidden items-center justify-center transition-colors sm:inline-flex"
                style={{
                  padding: "6px 10px",
                  fontSize: 12,
                  fontWeight: 500,
                  color: pathname.startsWith("/admin/grants")
                    ? "var(--text-primary)"
                    : "var(--text-secondary)",
                  borderRadius: 8,
                }}
              >
                Grants
              </Link>
            </>
          )}

          {/* Sign in / Sign out — swaps based on auth state */}
          {authed ? (
            <button
              type="button"
              onClick={handleSignOut}
              className="hidden items-center justify-center gap-1.5 transition-colors sm:inline-flex"
              style={{
                padding: "6px 10px",
                fontSize: 12,
                fontWeight: 500,
                color: "var(--text-secondary)",
                borderRadius: 8,
                background: "transparent",
                border: "1px solid var(--border-default)",
                cursor: "pointer",
              }}
            >
              <LogOut className="h-3.5 w-3.5" strokeWidth={1.75} />
              Sign out
            </button>
          ) : (
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
          )}

          {/* Subscribe CTA — hidden on mobile (lives in drawer); hidden when authed. */}
          {!authed && (
            <Link
              href={nav.cta.href}
              className="hidden items-center justify-center transition-colors md:inline-flex"
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
          )}
        </div>
      </div>
    </header>
  );
}
