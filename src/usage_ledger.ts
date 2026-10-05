export type MediaUsageEvent =
  | { event_id: string; customer_id: string; kind: "asset_ingested"; bytes: number }
  | { event_id: string; customer_id: string; kind: "processing_completed"; seconds: number }
  | { event_id: string; customer_id: string; kind: "creator_delivery"; bytes: number };

export type CustomerUsage = {
  customer_id: string;
  ingestion_bytes: number;
  processing_seconds: number;
  delivery_bytes: number;
};

export class UsageLedger {
  private readonly seen = new Set<string>();
  private readonly totals = new Map<string, CustomerUsage>();

  record(event: MediaUsageEvent): { accepted: boolean; usage: CustomerUsage } {
    const usage = this.totals.get(event.customer_id) ?? {
      customer_id: event.customer_id,
      ingestion_bytes: 0,
      processing_seconds: 0,
      delivery_bytes: 0
    };

    if (this.seen.has(event.event_id)) return { accepted: false, usage: { ...usage } };

    this.seen.add(event.event_id);
    if (event.kind === "asset_ingested") usage.ingestion_bytes += event.bytes;
    if (event.kind === "processing_completed") usage.processing_seconds += event.seconds;
    if (event.kind === "creator_delivery") usage.delivery_bytes += event.bytes;
    this.totals.set(event.customer_id, usage);
    return { accepted: true, usage: { ...usage } };
  }

  forCustomer(customerId: string): CustomerUsage {
    return { ...(this.totals.get(customerId) ?? {
      customer_id: customerId,
      ingestion_bytes: 0,
      processing_seconds: 0,
      delivery_bytes: 0
    }) };
  }
}
