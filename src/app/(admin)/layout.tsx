
import { AdminShell } from "./_components/admin-shell"

type AdminLayoutProps = {
  children: React.ReactNode
}

export default async function Layout({ children }: AdminLayoutProps) {
  return <AdminShell>{children}</AdminShell>
}
