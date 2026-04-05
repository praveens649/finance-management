import { getAdminClients } from "../_lib/clients";
import { createAdminService } from "../../../../../models/services/admin.service";

export async function GET() {
  try {
    const { userClient, serviceRoleClient } = await getAdminClients();
    const adminService = createAdminService(userClient, serviceRoleClient);
    const { data, error } = await adminService.getAllUsers();

    if (error) {
      const status = error.toLowerCase().includes("forbidden") || error.toLowerCase().includes("unauthorized") ? 403 : 400;
      return Response.json({ success: false, error }, { status });
    }

    return Response.json({ success: true, data }, { status: 200 });
  } catch (err: unknown) {
    console.error("GET /api/admin/users error:", err);
    return Response.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}