import { NextResponse } from "next/server";
import { getCustomerById, getOrders } from "@/lib/db";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const customer = await getCustomerById(id);
    if (!customer) return NextResponse.json({ error: "Customer not found" }, { status: 404 });

    // Get all orders for this customer
    const allOrders = await getOrders();
    const orders = allOrders.filter(
      (o) => o.customer.email.toLowerCase() === customer.email.toLowerCase()
    );

    return NextResponse.json({ customer, orders });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to fetch customer";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
