import { RedirectPage } from "@/components/redirect-page";

export const metadata = {
  title: "Redirecting to Support — HantaVirusTrack",
  robots: { index: false, follow: false },
};

export default function PricingRedirect() {
  return (
    <RedirectPage
      to="/support"
      label="HantaVirusTrack is now free for everyone — pricing has moved to the Support page."
    />
  );
}
