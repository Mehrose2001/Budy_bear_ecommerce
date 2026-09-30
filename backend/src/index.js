import express from "express";
import cors from "cors";
import { config } from "./config.js";
import { errorMiddleware } from "./lib/http.js";
import { healthRouter } from "./routes/health.js";
import { authRouter } from "./routes/auth.js";
import { catalogRouter } from "./routes/catalog.js";
import { ordersRouter } from "./routes/orders.js";
import { adminRouter, wishlistRouter } from "./routes/admin.js";
import { paymentsRouter } from "./routes/payments.js";
import { uploadsRoot } from "./services/storage.js";

const app = express();

app.use(
  cors({
    origin: config.frontendOrigins,
    credentials: true,
  })
);
app.use(express.json({ limit: "2mb" }));
app.use("/media", express.static(uploadsRoot));

app.use("/health", healthRouter);
app.use("/auth", authRouter);
app.use("/catalog", catalogRouter);
app.use("/orders", ordersRouter);
app.use("/wishlist", wishlistRouter);
app.use("/admin", adminRouter);
app.use("/payments", paymentsRouter);

app.use((_req, res) => {
  res.status(404).json({ error: "Not found" });
});

app.use(errorMiddleware);

app.listen(config.port, () => {
  console.log(`Budy Bear API listening on ${config.publicApiUrl}`);
});



