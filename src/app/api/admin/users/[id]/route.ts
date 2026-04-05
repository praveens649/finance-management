import { getAdminClients } from "../../_lib/clients";
import { createAdminService } from "../../../../../../models/services/admin.service";

type Context = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, context: Context) {
  try {
    const { id } = await context.params;
    const body = await request.json();

    const { userClient, serviceRoleClient } = await getAdminClients();
    const adminService = createAdminService(userClient, serviceRoleClient);
    const { data, error } = await adminService.updateUser(id, {
      full_name: typeof body.full_name === "string" ? body.full_name : undefined,
      role: typeof body.role === "string" ? body.role : undefined,
    });

    if (error) {
      const status = error.toLowerCase().includes("forbidden") || error.toLowerCase().includes("unauthorized") ? 403 : 400;
      return Response.json({ success: false, error }, { status });
    }

    return Response.json({ success: true, data }, { status: 200 });
  } catch (err: unknown) {
    console.error("PATCH /api/admin/users/[id] error:", err);
    return Response.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(_request: Request, context: Context) {
  try {
    const { id } = await context.params;

    const { userClient, serviceRoleClient } = await getAdminClients();
    const adminService = createAdminService(userClient, serviceRoleClient);
    const { success, error } = await adminService.deleteUser(id);

    if (!success) {
      const status = error?.toLowerCase().includes("forbidden") || error?.toLowerCase().includes("unauthorized") ? 403 : 400;
      return Response.json({ success: false, error }, { status });
    }

    return Response.json({ success: true }, { status: 200 });
  } catch (err: unknown) {
    console.error("DELETE /api/admin/users/[id] error:", err);
    return Response.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}