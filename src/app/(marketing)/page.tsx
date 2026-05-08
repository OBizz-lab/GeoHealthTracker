import { Hero }           from "@/components/marketing/hero";
import { StatsBand }       from "@/components/marketing/stats-band";
import { FeatureGrid }     from "@/components/marketing/feature-grid";
import { HowItWorks }      from "@/components/marketing/how-it-works";
import { SourcesStrip }    from "@/components/marketing/sources-strip";
import { PricingTeaser }   from "@/components/marketing/pricing-teaser";
import { FAQ }             from "@/components/marketing/faq";
import { NewsletterForm }  from "@/components/marketing/newsletter-form";
import { SiteFooter }      from "@/components/layout/site-footer";

export default function HomePage() {
  return (
    <>
      <Hero />
      <StatsBand />
      <FeatureGrid />
      <HowItWorks />
      <SourcesStrip />
      <PricingTeaser />
      <FAQ />
      <NewsletterForm />
      <SiteFooter />
    </>
  );
}
