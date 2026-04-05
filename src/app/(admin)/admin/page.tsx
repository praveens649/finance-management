import { redirect } from 'next/navigation'

// /admin → always redirect to the dashboard.
// AdminShell handles auth — if not logged in it shows the login form.
export default function AdminPage() {
  redirect('/admin/dashboard')
}