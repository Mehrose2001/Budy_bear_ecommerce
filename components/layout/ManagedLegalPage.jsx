import InfoPage from "@/components/layout/InfoPage";
import LegalContent from "@/components/layout/LegalContent";
import { getLegalPage } from "@/lib/catalog";

export default async function ManagedLegalPage({ slug }) {
  const page = await getLegalPage(slug);

  return (
    <InfoPage title={page.title} intro={page.intro}>
      <LegalContent text={page.body} />
    </InfoPage>
  );
}
