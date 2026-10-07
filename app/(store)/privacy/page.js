import InfoPage from "@/components/layout/InfoPage";
import LegalContent from "@/components/layout/LegalContent";
import { getLegalPage } from "@/lib/catalog";

export const metadata = { title: "Privacy Policy" };

export default async function PrivacyPage() {
  const page = await getLegalPage("privacy");

  return (
    <InfoPage title={page.title} intro={page.intro}>
      <LegalContent text={page.body} />
    </InfoPage>
  );
}
