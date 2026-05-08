import { RedirectPage } from "@/components/redirect-page";

export const metadata = {
  title: "Contact — HantaVirusTrack",
  robots: { index: false, follow: false },
};

export default function LegalContactRedirect() {
  return (
    <RedirectPage
      to="/about#contact"
      label="Contact details now live on the About page."
    />
  );
}
