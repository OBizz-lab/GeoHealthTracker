import { RedirectPage } from "@/components/redirect-page";

export const metadata = {
  title: "Terms — HantaVirusTrack",
  robots: { index: false, follow: false },
};

export default function LegalTermsRedirect() {
  return (
    <RedirectPage
      to="/about#terms"
      label="The Terms of Service now live on the About page."
    />
  );
}
