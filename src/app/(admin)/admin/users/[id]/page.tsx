import { AdminUserDrilldown } from "../../../_components/admin-user-drilldown"

type UserDrilldownPageProps = {
  params: Promise<{ id: string }>
}

export default async function UserDrilldownPage({ params }: UserDrilldownPageProps) {
  const { id } = await params

  return (
    <div className="space-y-4 p-4 md:p-6">
      <AdminUserDrilldown userId={id} />
    </div>
  )
}