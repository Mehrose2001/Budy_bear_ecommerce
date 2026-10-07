import InfoPage from "@/components/layout/InfoPage";
import LegalContent from "@/components/layout/LegalContent";
import { getLegalPage } from "@/lib/catalog";

export const metadata = { title: "About Budy Bear" };

export default async function AboutPage() {
  const page = await getLegalPage("about");

  return (
    <InfoPage title={page.title} intro={page.intro}>
      <LegalContent text={page.body} />
    </InfoPage>
  );
}
