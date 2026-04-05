import { getAdminClients } from "../../../_lib/clients";
import { createAdminService } from "../../../../../../../models/services/admin.service";

type Context = {
  params: Promise<{ id: string }>;
};

export async function PATCH(_request: Request, context: Context) {
  try {
    const { id } = await context.params;

    const { userClient, serviceRoleClient } = await getAdminClients();
    const adminService = createAdminService(userClient, serviceRoleClient);
    const { data, error } = await adminService.toggleUserActive(id);

    if (error) {
      const status = error.toLowerCase().includes("forbidden") || error.toLowerCase().includes("unauthorized") ? 403 : 400;
      return Response.json({ success: false, error }, { status });
    }

    return Response.json({ success: true, data }, { status: 200 });
  } catch (err: unknown) {
    console.error("PATCH /api/admin/users/[id]/toggle error:", err);
    return Response.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}