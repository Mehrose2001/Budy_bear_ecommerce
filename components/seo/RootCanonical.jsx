export default function RootCanonical({ href }) {
  if (!href) return null;
  return (
    <>
      <link rel="canonical" href={href} />
      <meta property="og:url" content={href} />
    </>
  );
}
