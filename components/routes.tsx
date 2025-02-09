// Auth Imports
import { IRoute } from '@/types/types';
import { PlusCircle } from 'lucide-react';
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
    name: 'Create plan',
    path: '/dashboard/plans/new',
    icon: (
      <PlusCircle className="-mt-[7px] h-4 w-4 stroke-2 text-inherit" />
    ),
    collapse: false
  },
  {
    name: 'Profile Settings',
    path: '/dashboard/settings',
    icon: (
      <HiOutlineCog8Tooth className="-mt-[7px] h-4 w-4 stroke-2 text-inherit" />
    ),
    collapse: false
  },
  // {
  //   name: 'AI Generator',
  //   path: '/dashboard/ai-generator',
  //   icon: (
  //     <HiOutlineDocumentText className="-mt-[7px] h-4 w-4 stroke-2 text-inherit" />
  //   ),
  //   collapse: false,
  //   disabled: true
  // },
  // {
  //   name: 'AI Assistant',
  //   path: '/dashboard/ai-assistant',
  //   icon: <HiOutlineUser className="-mt-[7px] h-4 w-4 stroke-2 text-inherit" />,
  //   collapse: false,
  //   disabled: true
  // },
  // {
  //   name: 'Users List',
  //   path: '/dashboard/users-list',
  //   icon: (
  //     <HiOutlineUsers className="-mt-[7px] h-4 w-4 stroke-2 text-inherit" />
  //   ),
  //   collapse: false,
  //   disabled: true
  // },
  // {
  //   name: 'Subscription',
  //   path: '/dashboard/subscription',
  //   icon: (
  //     <HiOutlineCreditCard className="-mt-[7px] h-4 w-4 stroke-2 text-inherit" />
  //   ),
  //   collapse: false,
  //   disabled: true
  // },
  // {
  //   name: 'Landing Page',
  //   path: '/home',
  //   icon: (
  //     <HiOutlineDocumentText className="-mt-[7px] h-4 w-4 stroke-2 text-inherit" />
  //   ),
  //   collapse: false,
  //   disabled: true
  // },
  // {
  //   name: 'Pricing Page',
  //   path: '/pricing',
  //   icon: (
  //     <HiOutlineCurrencyDollar className="-mt-[7px] h-4 w-4 stroke-2 text-inherit" />
  //   ),
  //   collapse: false,
  //   disabled: true
  // }
];
