"use client";

import MilestoneCard from "@/components/dashboard/MilestoneCard";
import ActivityCard from "@/components/milestones/ActivityCard";
import { ContractCardDemo } from "@/components/milestones/ContractDemo";
import { useMilestoneEventsRealtime } from "@/hooks/milestone.hooks";
import { useAppData } from "@/stores/app.store";

const MilestonePage = () => {
  const { milestone } = useAppData();
  useMilestoneEventsRealtime(milestone?.id);
  return (
    <div className="container w-full mx-auto flex flex-col gap-5 max-w-5xl">
      <MilestoneCard />
      <ContractCardDemo />
      <ActivityCard />
    </div>
  );
};

export default MilestonePage;
