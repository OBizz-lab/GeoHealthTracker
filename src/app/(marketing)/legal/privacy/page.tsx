import { RedirectPage } from "@/components/redirect-page";

export const metadata = {
  title: "Privacy — HantaVirusTrack",
  robots: { index: false, follow: false },
};

export default function LegalPrivacyRedirect() {
  return (
    <RedirectPage
      to="/about#privacy"
      label="The Privacy notice now lives on the About page."
    />
  );
}
