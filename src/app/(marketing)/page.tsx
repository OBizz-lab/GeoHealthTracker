import { FeatureGrid } from "@/components/marketing/feature-grid";
import { Hero } from "@/components/marketing/hero";
import { NewsletterForm } from "@/components/marketing/newsletter-form";
import { SiteFooter } from "@/components/marketing/site-footer";
import { StatsBar } from "@/components/marketing/stats-bar";

export default function HomePage() {
  return (
    <>
      <Hero />
      <StatsBar />
      <FeatureGrid />
      <NewsletterForm />
      <SiteFooter />
    </>
  );
}
