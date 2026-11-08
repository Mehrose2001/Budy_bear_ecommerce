const urls = [
  process.env.NEXT_PUBLIC_SITE_URL || "https://budybear.com",
  "https://www.budybear.com",
];

async function check(base) {
  const url = `${base.replace(/\/$/, "")}/api/health`;
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(20000) });
    const data = await res.json();
    return {
      url,
      ok: res.ok && data.ok,
      hasServiceRoleKey: Boolean(data.hasServiceRoleKey),
      supabaseConfigured: Boolean(data.supabaseConfigured),
      deployedHealth: Object.prototype.hasOwnProperty.call(data, "hasServiceRoleKey"),
    };
  } catch (error) {
    return { url, ok: false, error: error.message };
  }
}

const results = await Promise.all(urls.map(check));
console.log(JSON.stringify(results, null, 2));
const ready = results.every((r) => r.ok && r.hasServiceRoleKey);
process.exit(ready ? 0 : 1);
