import express from "express";
import { z } from "zod";
import { accountClientFromEnvironment, InfraiError } from "./infrai_account.js";
import { UsageLedger, type MediaUsageEvent } from "./usage_ledger.js";

const eventSchema = z.discriminatedUnion("kind", [
  z.object({ event_id: z.string().min(1), customer_id: z.string().min(1), kind: z.literal("asset_ingested"), bytes: z.number().int().nonnegative() }).strict(),
  z.object({ event_id: z.string().min(1), customer_id: z.string().min(1), kind: z.literal("processing_completed"), seconds: z.number().int().nonnegative() }).strict(),
  z.object({ event_id: z.string().min(1), customer_id: z.string().min(1), kind: z.literal("creator_delivery"), bytes: z.number().int().nonnegative() }).strict()
]);

const ledger = new UsageLedger();
const app = express();
app.use(express.json());

app.post("/usage-events", (req, res) => {
  const parsed = eventSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "invalid_usage_event", details: parsed.error.flatten() });
    return;
  }
  const result = ledger.record(parsed.data as MediaUsageEvent);
  res.status(result.accepted ? 202 : 200).json(result);
});

app.get("/customers/:customerId/usage", (req, res) => {
  res.json(ledger.forCustomer(req.params.customerId));
});

app.get("/reconciliation/account-usage", async (_req, res) => {
  try {
    const timeseries = await accountClientFromEnvironment().usageTimeseries();
    res.json({ source: "infrai.account.usage.timeseries", timeseries });
  } catch (error) {
    if (error instanceof InfraiError) {
      res.status(error.status >= 400 && error.status < 500 ? error.status : 502)
        .json({ error: error.code, message: error.message });
      return;
    }
    res.status(502).json({ error: "account_usage_unavailable" });
  }
});

const port = Number(process.env.PORT ?? 3000);
app.listen(port, () => console.log(`Media usage service listening on http://localhost:${port}`));
