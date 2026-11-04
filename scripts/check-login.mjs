const email = process.env.ADMIN_BOOTSTRAP_EMAIL;
const password = process.env.ADMIN_BOOTSTRAP_PASSWORD;
const response = await fetch("http://localhost:3000/api/auth/login", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ email, password }),
});
const data = await response.json().catch(() => ({}));
console.log(
  JSON.stringify({
    status: response.status,
    role: data.user?.role || null,
    email: data.user?.email || null,
    hasToken: Boolean(data.accessToken),
    error: data.error || null,
  })
);

if (data.accessToken) {
  const me = await fetch("http://localhost:3000/api/auth/me", {
    headers: { Authorization: `Bearer ${data.accessToken}` },
  });
  const meData = await me.json().catch(() => ({}));
  console.log(
    JSON.stringify({
      meStatus: me.status,
      meRole: meData.user?.role || null,
      meError: meData.error || null,
    })
  );
}
