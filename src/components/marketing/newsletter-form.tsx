"use client";

import { useState } from "react";
import { Mail } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { newsletter } from "@/lib/copy";

export function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "success">(
    "idle",
  );

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!email) return;
    setStatus("submitting");
    setTimeout(() => {
      setStatus("success");
      setEmail("");
    }, 600);
  }

  return (
    <section className="border-b border-border">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-border bg-card/60 p-8 sm:p-12">
          <div className="grid gap-8 lg:grid-cols-2 lg:items-center">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-3 py-1 text-xs font-medium uppercase tracking-wider text-blue-300">
                <Mail className="h-3 w-3" />
                Newsletter
              </span>
              <h2 className="mt-4 text-2xl font-semibold tracking-tight text-zinc-50 sm:text-3xl">
                {newsletter.title}
              </h2>
              <p className="mt-3 text-zinc-400">{newsletter.description}</p>
            </div>
            <form
              onSubmit={handleSubmit}
              className="flex flex-col gap-3 sm:flex-row"
              aria-label="Subscribe to the newsletter"
            >
              <Input
                type="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder={newsletter.placeholder}
                className="h-11 flex-1 bg-background"
                disabled={status !== "idle"}
              />
              <Button
                type="submit"
                size="lg"
                className="h-11"
                disabled={status === "submitting"}
              >
                {status === "submitting" ? "Subscribing…" : newsletter.cta}
              </Button>
            </form>
          </div>
          {status === "success" ? (
            <p className="mt-4 text-sm text-emerald-400">
              {newsletter.success}
            </p>
          ) : null}
        </div>
      </div>
    </section>
  );
}
