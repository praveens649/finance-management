
'use client'

import { useState } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, Mail, Lock } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'

import { signInUserQuery } from '../_query/auth.query'
import { AuthService } from '../../../../../models/services/auth.service'
// import { signInUserQuery } from '../_query/auth.query'

export function AuthForm() {
    const router = useRouter()
    const [selectedRole, setSelectedRole] = useState<'user' | 'analyst'>('user')

    const [showPassword, setShowPassword] = useState(false)
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [rememberMe, setRememberMe] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!email || !password) {
            toast.error('Please enter both email and password')
            return
        }

        setIsSubmitting(true)

        try {
            const { roles } = await signInUserQuery({ email, password })
            const normalizedRoles = roles.map((role) => role.toLowerCase())

            if (normalizedRoles.includes('admin')) {
                await AuthService.signOut().catch(() => undefined)
                toast.error('This is not admin authentication')
                return
            }

            if (!normalizedRoles.includes(selectedRole)) {
                await AuthService.signOut().catch(() => undefined)
                toast.error(`This account is not registered as ${selectedRole}`)
                return
            }

            if (selectedRole === 'user') {
                router.push('/user')
                return
            }

            if (selectedRole === 'analyst') {
                router.push('/analyst')
                return
            }

            toast.error('No valid role found for this portal')
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Unable to sign in'
            toast.error(message)
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <div className="grid min-h-screen grid-cols-1 lg:grid-cols-2">

            {/* LEFT SIDE */}
            <div className="hidden lg:flex items-center justify-center bg-muted/40 p-12">
                <div className="relative h-full w-full overflow-hidden rounded-xl border border-border bg-background/80">
                    <Image
                        src="/landing.png"
                        alt="Finance management platform preview"
                        fill
                        priority
                        sizes="50vw"
                        className="object-contain object-center p-8"
                    />
                </div>

            </div>

            {/* RIGHT SIDE */}
            <div className="flex items-center justify-center p-8">

                <div className="w-full max-w-md">

                    <div className="mb-8">
                        <div className="mb-5 grid grid-cols-2 gap-2 rounded-lg border border-border p-1">
                            <button
                                type="button"
                                onClick={() => setSelectedRole('user')}
                                className={`h-10 rounded-md text-sm font-medium transition-colors ${selectedRole === 'user'
                                        ? 'bg-primary text-primary-foreground'
                                        : 'text-muted-foreground hover:bg-muted'
                                    }`}
                            >
                                User
                            </button>
                            <button
                                type="button"
                                onClick={() => setSelectedRole('analyst')}
                                className={`h-10 rounded-md text-sm font-medium transition-colors ${selectedRole === 'analyst'
                                        ? 'bg-primary text-primary-foreground'
                                        : 'text-muted-foreground hover:bg-muted'
                                    }`}
                            >
                                Analyst
                            </button>
                        </div>

                        <h2 className="text-3xl font-bold mb-2">
                            Welcome back, {selectedRole}
                        </h2>

                        <p className="text-muted-foreground text-sm">
                            Enter your credentials to continue
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">

                        {/* EMAIL */}
                        <div className="space-y-2">
                            <Label>Email Address</Label>

                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />

                                <Input
                                    type="email"
                                    placeholder="example@email.com"
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
                                    placeholder="Enter your password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="pl-10 pr-10 h-11"
                                />

                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>

                        {/* REMEMBER */}
                        <div className="flex items-center justify-between pt-1">

                            <div className="flex items-center gap-2">
                                <Checkbox
                                    checked={rememberMe}
                                    onCheckedChange={(checked) =>
                                        setRememberMe(checked as boolean)
                                    }
                                />

                                <span className="text-sm text-muted-foreground">
                                    Remember me
                                </span>
                            </div>

                            <a
                                href="#"
                                className="text-sm font-medium text-primary hover:underline"
                            >
                                Forgot password?
                            </a>

                        </div>

                        <Button
                            type="submit"
                            className="w-full h-11 text-base mt-4"
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? 'Signing In...' : 'Log In'}
                        </Button>

                    </form>

                    {/* DIVIDER */}
                    <div className="flex items-center gap-4 my-7">
                        <div className="flex-1 h-px bg-border" />
                        <span className="text-xs text-muted-foreground">
                            OR CONTINUE WITH
                        </span>
                        <div className="flex-1 h-px bg-border" />
                    </div>

                    <p className="text-center text-sm text-muted-foreground mt-8">
                        Don’t have an account?{" "}
                        <a
                            href="/signup"
                            className="text-primary font-medium hover:underline"
                        >
                            Sign up
                        </a>
                    </p>

                </div>

            </div>

        </div>
    )
}

