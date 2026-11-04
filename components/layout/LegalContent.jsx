import LegalBody from "@/components/layout/LegalBody";
import { looksLikeHtml, sanitizeHtml } from "@/lib/legalHtml";

export default function LegalContent({ text }) {
  if (looksLikeHtml(text)) {
    return (
      <div
        className="legal-html space-y-4 font-normal [&_p]:font-normal [&_li]:font-normal [&_b]:font-bold [&_strong]:font-bold [&_em]:italic [&_h1]:text-2xl [&_h1]:font-black [&_h1]:text-brand-primary [&_h2]:mt-6 [&_h2]:text-lg [&_h2]:font-black [&_h2]:text-brand-primary [&_h3]:text-base [&_h3]:font-bold [&_a]:font-semibold [&_a]:text-brand-primary [&_a]:underline [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:space-y-2 [&_ol]:pl-5"
        dangerouslySetInnerHTML={{ __html: sanitizeHtml(text) }}
      />
    );
  }

  return <LegalBody text={text} />;
}
