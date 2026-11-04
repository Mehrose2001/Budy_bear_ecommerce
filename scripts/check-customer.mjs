const stamp = Date.now();
const email = `shopper${stamp}@example.com`;
const password = "Customer123###";
const register = await fetch("http://localhost:3000/api/auth/register", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    email,
    password,
    fullName: "Local Shopper",
    phone: "03001234567",
  }),
});
const created = await register.json().catch(() => ({}));
console.log(
  JSON.stringify({
    registerStatus: register.status,
    role: created.user?.role || null,
    hasToken: Boolean(created.accessToken),
    needsConfirm: Boolean(created.needsConfirm),
    error: created.error || null,
  })
);

const login = await fetch("http://localhost:3000/api/auth/login", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ email, password }),
});
const session = await login.json().catch(() => ({}));
console.log(
  JSON.stringify({
    loginStatus: login.status,
    role: session.user?.role || null,
    hasToken: Boolean(session.accessToken),
    error: session.error || null,
  })
);

if (session.accessToken) {
  const wish = await fetch("http://localhost:3000/api/wishlist", {
    headers: { Authorization: `Bearer ${session.accessToken}` },
  });
  const wishData = await wish.json().catch(() => ({}));
  const orders = await fetch("http://localhost:3000/api/orders/mine", {
    headers: { Authorization: `Bearer ${session.accessToken}` },
  });
  const orderData = await orders.json().catch(() => ({}));
  console.log(
    JSON.stringify({
      wishStatus: wish.status,
      wishCount: Array.isArray(wishData.items) ? wishData.items.length : null,
      orderStatus: orders.status,
      orderCount: Array.isArray(orderData.orders) ? orderData.orders.length : null,
      orderError: orderData.error || null,
    })
  );
}
