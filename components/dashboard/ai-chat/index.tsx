'use client';

import PlanCreationWizard from "./plans/PlanCreationWizard";
import DashboardLayout from "@/components/layout";
import { User } from "@supabase/supabase-js";

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
      <PlanCreationWizard />
    </DashboardLayout>
  );
}
