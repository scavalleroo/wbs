'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { OpenContext, UserContext } from '@/contexts/layout';
import { getRedirectMethod } from '@/utils/auth-helpers/settings';
import { useTheme } from 'next-themes';
import { useRouter } from 'next/navigation';
import React, { useContext, useEffect, useState } from 'react';
import { FiAlignJustify } from 'react-icons/fi';
import {
  HiOutlineMoon,
  HiOutlineSun,
  HiOutlineArrowRightOnRectangle
} from 'react-icons/hi2';
import { createClient } from '@/utils/supabase/client';

const supabase = createClient();
export default function HeaderLinks(props: { [x: string]: any }) {
  const { open, setOpen } = useContext(OpenContext)!;
  const user = useContext(UserContext);
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const router = getRedirectMethod() === 'client' ? useRouter() : null;


  useEffect(() => {
    console.log('OpenContext:', { open, setOpen });
  }, [open]);

  // Ensures this component is rendered only on the client
  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSignOut = async (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    await supabase.auth.signOut();
    if (router) {
      router.push('/dashboard/signin');
    }
  };

  if (!mounted) return null;

  return (
    <div className="relative flex min-w-max max-w-max flex-grow items-center justify-around gap-1 rounded-lg md:px-2 md:py-2 md:pl-3 xl:gap-2">
      <Button
        variant="outline"
        className="flex h-9 min-w-9 cursor-pointer rounded-full border-zinc-200 p-0 text-xl text-zinc-950 dark:border-zinc-800 dark:text-white md:min-h-10 md:min-w-10 xl:hidden"
        onClick={() => {
          setOpen(!open);
        }}
      >
        <FiAlignJustify className="h-4 w-4" />
      </Button>
      <Button
        variant="outline"
        className="flex h-9 min-w-9 cursor-pointer rounded-full border-zinc-200 p-0 text-xl text-zinc-950 dark:border-zinc-800 dark:text-white md:min-h-10 md:min-w-10"
        onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      >
        {theme === 'light' ? (
          <HiOutlineMoon className="h-4 w-4 stroke-2" />
        ) : (
          <HiOutlineSun className="h-5 w-5 stroke-2" />
        )}
      </Button>
      <Button
        onClick={(e) => handleSignOut(e)}
        variant="outline"
        className="flex h-9 min-w-9 cursor-pointer rounded-full border-zinc-200 p-0 text-xl text-zinc-950 dark:border-zinc-800 dark:text-white md:min-h-10 md:min-w-10"
      >
        <HiOutlineArrowRightOnRectangle className="h-4 w-4 stroke-2 text-zinc-950 dark:text-white" />
      </Button>
      <a className="w-full" href="/dashboard/settings">
        <Avatar className="h-9 min-w-9 md:min-h-10 md:min-w-10">
          <AvatarImage src={user?.user_metadata.avatar_url} />
          <AvatarFallback className="font-bold">
            {user?.user_metadata.full_name
              ? `${user?.user_metadata.full_name[0]}`
              : `${user?.email?.[0]?.toUpperCase() || ''}`}
          </AvatarFallback>
        </Avatar>
      </a>
    </div>
  );
}
