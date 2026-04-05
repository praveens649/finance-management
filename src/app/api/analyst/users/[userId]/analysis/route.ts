import { getAnalystClients } from "../../../_lib/clients";
import { createAnalystService } from "../../../../../../../models/services/analyst.service";

type Context = {
  params: Promise<{ userId: string }>;
};

export async function GET(request: Request, context: Context) {
  try {
    const { userId } = await context.params;
    const url = new URL(request.url);
    const rawPeriod = url.searchParams.get("period");
    const period = rawPeriod === "weekly" ? "weekly" : "monthly";

    const { serviceRoleClient } = await getAnalystClients();
    const analystService = createAnalystService(serviceRoleClient);
    const { data, error } = await analystService.getUserAnalysis(userId, period);

    if (error) {
      const status = error.toLowerCase().includes("forbidden") || error.toLowerCase().includes("unauthorized")
        ? 403
        : 400;

      return Response.json({ success: false, error }, { status });
    }

    return Response.json({ success: true, data }, { status: 200 });
  } catch (err: unknown) {
    console.error("GET /api/analyst/users/[userId]/analysis error:", err);
    return Response.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}