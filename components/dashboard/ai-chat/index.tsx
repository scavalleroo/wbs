'use client';
/*eslint-disable*/

import DashboardLayout from '@/components/layout';
import { Button } from '@/components/ui/button';
import Bgdark from '@/public/img/dark/ai-chat/bg-image.png';
import Bg from '@/public/img/light/ai-chat/bg-image.png';
import { User } from '@supabase/supabase-js';
import { useTheme } from 'next-themes';
import { useState } from 'react';
import { HiUser, HiSparkles, HiMiniPencilSquare } from 'react-icons/hi2';
import { Input } from '@/components/ui/input';

interface Props {
  user: User | null | undefined;
  userDetails: { [x: string]: any } | null;
}
export default function Chat(props: Props) {

  return (
    <DashboardLayout
      user={props.user}
      userDetails={props.userDetails}
      title="AI Generator"
      description="AI Generator"
    >

    </DashboardLayout>
  );
}
