// Auth Imports
import { IRoute } from '@/types/types';
import { Calendar, Sparkles } from 'lucide-react';
import {
  HiOutlineHome,
  HiOutlineCog8Tooth,
} from 'react-icons/hi2';

export const routes: IRoute[] = [
  {
    name: 'My plans',
    path: '/dashboard/main',
    icon: <HiOutlineHome className="-mt-[7px] h-4 w-4 stroke-2 text-inherit" />,
    collapse: false
  },
  {
    name: 'Calendar',
    path: '/dashboard/calendar',
    icon: (
      <Calendar className="-mt-[7px] h-4 w-4 stroke-2 text-inherit" />
    ),
    collapse: false
  },
  {
    name: 'New plan',
    path: '/dashboard/plans/new',
    icon: (
      <Sparkles className="-mt-[7px] h-4 w-4 stroke-2 text-inherit" />
    ),
    collapse: false,
  },
  {
    name: 'Profile Settings',
    path: '/dashboard/settings',
    icon: (
      <HiOutlineCog8Tooth className="-mt-[7px] h-4 w-4 stroke-2 text-inherit" />
    ),
    collapse: false
  },
];
