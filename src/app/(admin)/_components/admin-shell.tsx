'use client'

import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@/components/providers/auth-provider'
import { AuthService } from '@/services/auth/auth.service'

import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'
import { TooltipProvider } from '@/components/ui/tooltip'
import { AdminAuthForm } from '../admin/_components/admin-auth-form'
import { AppSidebar } from './app-sidebar'
import LoaderComponent from '@/components/ui/globals/screen-loader'

type AdminShellProps = {
  children: React.ReactNode
}

function AdminShellContent({ children }: AdminShellProps) {
  const router = useRouter()
  const { user, isLoading } = useAuth()

  const adminAuthorizationQuery = useQuery({
    queryKey: ['admin-authorization', user?.id],
    enabled: Boolean(user),
    retry: false,
    queryFn: async () => {
      if (!user) {
        return { isAdmin: false }
      }

      try {
        const roles = await AuthService.getUserRoles(user.id)
        const hasAdminRole = roles.some((role) => role.toLowerCase() === 'admin')

        if (!hasAdminRole) {
          await AuthService.signOut().catch(() => undefined)
          router.replace('/')
          return { isAdmin: false }
        }

        return { isAdmin: true }
      } catch {
        await AuthService.signOut().catch(() => undefined)
        router.replace('/admin')
        return { isAdmin: false }
      }
    },
  })

  if (isLoading || (user && adminAuthorizationQuery.isPending)) {
    return <LoaderComponent fullScreen />
  }

  if (!user) {
    return <AdminAuthForm />
  }

  const isAdmin = adminAuthorizationQuery.data?.isAdmin ?? false

  if (!isAdmin) {
    return <LoaderComponent fullScreen />
  }

  return (
    <SidebarProvider>
      <TooltipProvider>
        <AppSidebar />
        <SidebarInset>
          <main>
            <div className="p-2">
              <SidebarTrigger />
            </div>
            <TooltipProvider>
              {children}
            </TooltipProvider>
          </main>
        </SidebarInset>
      </TooltipProvider>
    </SidebarProvider>
  )
}

export function AdminShell({ children }: AdminShellProps) {
  return <AdminShellContent>{children}</AdminShellContent>
}