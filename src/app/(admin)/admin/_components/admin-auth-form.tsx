
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, Lock, Mail } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AuthService } from '../../../../../models/services/auth.service'
import { signInAdminQuery } from '../_query/admin-auth.query'
// import { signInAdminQuery } from '../_query/admin-auth.query'

export function AdminAuthForm() {
  const router = useRouter()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!email || !password) {
      toast.error('Please enter both email and password')
      return
    }

    setIsSubmitting(true)

    try {
      const { roles } = await signInAdminQuery({ email, password })
      const normalizedRoles = roles.map((role) => role.toLowerCase())

      if (!normalizedRoles.includes('admin')) {
        await AuthService.signOut().catch(() => undefined)
        toast.error('Access denied. Admin account required.')
        return
      }

      toast.success('Admin login successful')
      router.replace('/admin/dashboard')
      router.refresh()
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unable to sign in as admin'
      toast.error(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="grid min-h-screen grid-cols-1 lg:grid-cols-2">

      {/* LEFT SIDE */}
      <div className="hidden lg:flex items-center justify-center bg-muted/40 p-12">

        <div className="flex h-full w-full items-center justify-center rounded-xl border border-dashed border-border bg-background/60">
          <span className="text-sm text-muted-foreground">
            Left side illustration / branding placeholder
          </span>
        </div>

      </div>

      {/* RIGHT SIDE */}
      <div className="flex items-center justify-center p-8">

        <div className="w-full max-w-md">

          <div className="mb-8">
            <h2 className="text-3xl font-bold mb-2">
              Admin Login
            </h2>

            <p className="text-muted-foreground text-sm">
              Sign in with your administrator credentials
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">

            {/* EMAIL */}
            <div className="space-y-2">
              <Label>Email</Label>

              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />

                <Input
                  type="email"
                  placeholder="admin@platform.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 h-11"
                />
              </div>
            </div>

            {/* PASSWORD */}
            <div className="space-y-2">
              <Label>Password</Label>

              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />

                <Input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your admin password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10 h-11"
                />

                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full h-11 text-base mt-4"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Signing in...' : 'Admin Log In'}
            </Button>

          </form>

        </div>

      </div>

    </div>
  )
}

