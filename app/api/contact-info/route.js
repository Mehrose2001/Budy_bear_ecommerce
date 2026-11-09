import { NextResponse } from "next/server";
import { senderFromContactPage } from "@/lib/contactSender";
import { getDefaultLegalPage, mergeLegalPage } from "@/data/legalPages";
import { getStorePage } from "@/services/contentService";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export async function GET() {
  try {
    let page = null;
    if (isSupabaseConfigured()) {
      page = await getStorePage("contact");
    }
    if (!page) {
      page = mergeLegalPage("contact", null) || getDefaultLegalPage("contact");
    }
    const sender = senderFromContactPage(page);
    return NextResponse.json({ sender });
  } catch (error) {
    const page = mergeLegalPage("contact", null) || getDefaultLegalPage("contact");
    return NextResponse.json({
      sender: senderFromContactPage(page),
      warning: error?.message,
    });
  }
}
