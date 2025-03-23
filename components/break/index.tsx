'use client';

import { User } from '@supabase/supabase-js';

interface Props {
    user: User | null | undefined;
}

export default function Break(props: Props) {
    return (
        <h1></h1>
    );
}