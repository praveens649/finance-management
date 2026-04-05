
'use client'

import { useState } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, Mail, Lock, User, AtSign } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { signUpUserQuery } from '../_query/auth.query'
// import { signUpUserQuery } from '../_query/auth.query'

export function SignupForm() {
    const router = useRouter()
    const [selectedRole, setSelectedRole] = useState<'user' | 'analyst'>('user')

    const [showPassword, setShowPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)

    const [form, setForm] = useState({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        confirmPassword: '',
    })

    const handleChange = (field: string, value: string) => {
        setForm((prev) => ({ ...prev, [field]: value }))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!form.firstName || !form.lastName || !form.email || !form.password) {
            toast.error('Please fill in all required fields')
            return
        }

        if (form.password !== form.confirmPassword) {
            toast.error('Passwords do not match')
            return
        }

        setIsSubmitting(true)

        try {
            await signUpUserQuery({
                email: form.email,
                password: form.password,
                firstName: form.firstName,
                lastName: form.lastName,
                role: selectedRole,
            })

            toast.success('Account created successfully')
            router.push('/')
        } catch (error) {
            const message =
                error instanceof Error ? error.message : 'Unable to create account'
            toast.error(message)
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <div className="grid h-screen grid-cols-1 lg:grid-cols-2 overflow-hidden">

            {/* LEFT SIDE */}
            <div className="hidden lg:flex items-center justify-center bg-muted/40 p-10">
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
            <div className="flex items-center justify-center px-8">

                <div className="w-full max-w-md">

                    {/* ROLE TABS */}
                    <div className="mb-6 grid grid-cols-2 gap-2 rounded-lg border border-border p-1">
                        <button
                            type="button"
                            onClick={() => setSelectedRole('user')}
                            className={`h-10 rounded-md text-sm font-medium transition ${selectedRole === 'user'
                                    ? 'bg-primary text-primary-foreground'
                                    : 'text-muted-foreground hover:bg-muted'
                                }`}
                        >
                            User
                        </button>

                        <button
                            type="button"
                            onClick={() => setSelectedRole('analyst')}
                            className={`h-10 rounded-md text-sm font-medium transition ${selectedRole === 'analyst'
                                    ? 'bg-primary text-primary-foreground'
                                    : 'text-muted-foreground hover:bg-muted'
                                }`}
                        >
                            Analyst
                        </button>
                    </div>

                    {/* HEADER */}
                    <div className="mb-6">
                        <h2 className="text-3xl font-bold mb-2">
                            Create your {selectedRole} account
                        </h2>

                        <p className="text-muted-foreground text-sm">
                            Set up your profile to get started
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">

                        {/* NAME */}
                        <div className="grid grid-cols-2 gap-4">

                            <div className="space-y-2">
                                <Label>First Name</Label>

                                <div className="relative">
                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />

                                    <Input
                                        placeholder="John"
                                        className="pl-10 h-11"
                                        value={form.firstName}
                                        onChange={(e) => handleChange('firstName', e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label>Last Name</Label>

                                <Input
                                    placeholder="Doe"
                                    className="h-11"
                                    value={form.lastName}
                                    onChange={(e) => handleChange('lastName', e.target.value)}
                                />
                            </div>

                        </div>



                        {/* EMAIL */}
                        <div className="space-y-2">
                            <Label>Email Address</Label>

                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />

                                <Input
                                    type="email"
                                    placeholder="example@email.com"
                                    className="pl-10 h-11"
                                    value={form.email}
                                    onChange={(e) => handleChange('email', e.target.value)}
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
                                    placeholder="Create a strong password"
                                    className="pl-10 pr-10 h-11"
                                    value={form.password}
                                    onChange={(e) => handleChange('password', e.target.value)}
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

                        {/* CONFIRM PASSWORD */}
                        <div className="space-y-2">
                            <Label>Confirm Password</Label>

                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />

                                <Input
                                    type={showConfirmPassword ? 'text' : 'password'}
                                    placeholder="Re-enter password"
                                    className="pl-10 pr-10 h-11"
                                    value={form.confirmPassword}
                                    onChange={(e) => handleChange('confirmPassword', e.target.value)}
                                />

                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                >
                                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>

                        <Button
                            type="submit"
                            className="w-full h-11 text-base mt-2"
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? 'Creating Account...' : 'Create Account'}
                        </Button>

                    </form>

                    <p className="text-center text-sm text-muted-foreground mt-6">
                        Already have an account?{' '}
                        <a href="/" className="text-primary font-medium hover:underline">
                            Log in
                        </a>
                    </p>

                </div>

            </div>

        </div>
    )
}

