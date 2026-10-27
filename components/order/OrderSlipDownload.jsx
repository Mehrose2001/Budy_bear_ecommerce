"use client";

import { Download } from "lucide-react";
import Button from "@/components/ui/Button";
import { downloadOrderSlip } from "@/lib/orderSlipPdf";

export default function OrderSlipDownload({ order, variant = "primary", size = "md", label = "Download slip" }) {
  if (!order) return null;

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      onClick={() => {
        downloadOrderSlip(order);
      }}
    >
      <Download className="h-4 w-4" />
      {label}
    </Button>
  );
}
