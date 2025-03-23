'use client'

import { createContext, useContext, useEffect, useRef, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { SupabaseClient, Session } from '@supabase/supabase-js'
import type { Database } from '@/types/database.types'
import { useRouter } from 'next/navigation'

type SupabaseContext = {
    supabase: SupabaseClient<Database>
    session: Session | null
    isLoading: boolean
}

const Context = createContext<SupabaseContext | undefined>(undefined)

export default function SupabaseProvider({
    children,
}: {
    children: React.ReactNode
}) {
    const [session, setSession] = useState<Session | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const router = useRouter()
    const isInitialLoad = useRef(true)

    useEffect(() => {
        // Get initial session
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session)
            setIsLoading(false)
            isInitialLoad.current = false
        })

        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange(async (event, session) => {
            setSession(session)

            if (event === 'SIGNED_IN') {
                router.refresh()
            }
            if (event === 'SIGNED_OUT' && !isInitialLoad.current) {
                router.refresh()
                router.push('/signin')
            }
            if (event === 'USER_UPDATED') {
                router.refresh()
            }
        })

        return () => {
            subscription.unsubscribe()
        }
    }, [router])

    return (
        <Context.Provider value={{ supabase, session, isLoading }}>
            {children}
        </Context.Provider>
    )
}

export const useSupabase = () => {
    const context = useContext(Context)
    if (context === undefined) {
        throw new Error('useSupabase must be used inside SupabaseProvider')
    }
    return context
}