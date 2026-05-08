import { RedirectPage } from "@/components/redirect-page";

export const metadata = {
  title: "Disclaimer — HantaVirusTrack",
  robots: { index: false, follow: false },
};

export default function LegalDisclaimerRedirect() {
  return (
    <RedirectPage
      to="/about#disclaimer"
      label="The Disclaimer now lives on the About page."
    />
  );
}
