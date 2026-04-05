import { getAdminClients } from "../../../_lib/clients";
import { createAdminService } from "../../../../../../../models/services/admin.service";

type Context = {
  params: Promise<{ id: string }>;
};

export async function GET(request: Request, context: Context) {
  try {
    const { id } = await context.params;
    const url = new URL(request.url);
    const rawPeriod = url.searchParams.get("period");
    const period = rawPeriod === "weekly" ? "weekly" : "monthly";

    const { userClient, serviceRoleClient } = await getAdminClients();
    const adminService = createAdminService(userClient, serviceRoleClient);
    const { data, error } = await adminService.getUserSnapshot(id, period);

    if (error) {
      const status = error.toLowerCase().includes("forbidden") || error.toLowerCase().includes("unauthorized") ? 403 : 400;
      return Response.json({ success: false, error }, { status });
    }

    return Response.json({ success: true, data }, { status: 200 });
  } catch (err: unknown) {
    console.error("GET /api/admin/users/[id]/snapshot error:", err);
    return Response.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}