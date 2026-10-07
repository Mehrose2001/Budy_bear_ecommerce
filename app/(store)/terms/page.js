import InfoPage from "@/components/layout/InfoPage";
import LegalContent from "@/components/layout/LegalContent";
import { getLegalPage } from "@/lib/catalog";

export const metadata = { title: "Terms & Conditions" };

export default async function TermsPage() {
  const page = await getLegalPage("terms");

  return (
    <InfoPage title={page.title} intro={page.intro}>
      <LegalContent text={page.body} />
    </InfoPage>
  );
}
