import { createServerFn } from "@tanstack/react-start";

/**
 * Razorpay integration scaffold. Keys live only in server env
 * (RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET). Until both are set the app runs in
 * clearly-labelled Demo Payment Mode: nothing is charged and only a simulated
 * success callback can mark a booking as Paid.
 *
 * Raw card numbers, CVVs and bank credentials are never sent here or stored.
 */

export type PaymentConfig = {
  configured: boolean;
  provider: "razorpay";
  keyId?: string;
  message: string;
};

export const getPaymentConfig = createServerFn({ method: "GET" }).handler(
  async (): Promise<PaymentConfig> => {
    const keyId = process.env["RAZORPAY_KEY_ID"];
    const secret = process.env["RAZORPAY_KEY_SECRET"];
    if (!keyId || !secret) {
      return {
        configured: false,
        provider: "razorpay",
        message:
          "Demo Payment Mode — no live payment gateway is connected, so no money moves. Add Razorpay keys to take real UPI, card, net banking and wallet payments.",
      };
    }
    return {
      configured: true,
      provider: "razorpay",
      keyId,
      message: "Razorpay is connected. Payments are processed securely by the gateway.",
    };
  },
);

export const createRazorpayOrder = createServerFn({ method: "POST" })
  .validator((input: { bookingId: string; amount: number }) => {
    if (!input?.bookingId || typeof input.amount !== "number" || input.amount <= 0) {
      throw new Error("Invalid order request");
    }
    return input;
  })
  .handler(async ({ data }) => {
    const keyId = process.env["RAZORPAY_KEY_ID"];
    const secret = process.env["RAZORPAY_KEY_SECRET"];
    if (!keyId || !secret) {
      return { ok: false as const, demo: true as const, message: "Demo Payment Mode: no gateway order created." };
    }
    const res = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Basic ${btoa(`${keyId}:${secret}`)}`,
      },
      body: JSON.stringify({
        amount: Math.round(data.amount * 100),
        currency: "INR",
        receipt: data.bookingId,
      }),
    });
    if (!res.ok) {
      return { ok: false as const, demo: false as const, message: "The payment gateway rejected this order. Please try again." };
    }
    const order = (await res.json()) as { id: string; amount: number };
    return { ok: true as const, demo: false as const, orderId: order.id, keyId, amount: order.amount };
  });
