'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSupabase } from '../supabase-provider'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'

export default function LoginPage() {
    const router = useRouter()
    const { supabase } = useSupabase()
    const [loading, setLoading] = useState(false)

    const handleGoogleLogin = async () => {
        try {
            setLoading(true)
            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
            })
            if (error) throw error
        } catch (error) {
            console.error('Error:', error)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle className="text-2xl text-center">AI Goal Planner</CardTitle>
                </CardHeader>
                <CardContent>
                    <Button
                        className="w-full"
                        onClick={handleGoogleLogin}
                        disabled={loading}
                    >
                        {loading ? 'Loading...' : 'Continue with Google'}
                    </Button>
                </CardContent>
            </Card>
        </div>
    )
}