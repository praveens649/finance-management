import { getAnalystClients } from "../_lib/clients";
import { createAnalystService } from "../../../../../models/services/analyst.service";

export async function GET() {
  try {
    const { serviceRoleClient } = await getAnalystClients();
    const analystService = createAnalystService(serviceRoleClient);
    const { data, error } = await analystService.getMonthlyStats();

    if (error) {
      const status = error.toLowerCase().includes("forbidden") || error.toLowerCase().includes("unauthorized")
        ? 403
        : 400;

      return Response.json({ success: false, error }, { status });
    }

    return Response.json({ success: true, data }, { status: 200 });
  } catch (err: unknown) {
    console.error("GET /api/analyst/monthly error:", err);
    return Response.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}