"use client";

import MilestoneCard from "@/components/dashboard/MilestoneCard";
import ActivityCard from "@/components/milestones/ActivityCard";

const MilestonePage = () => {
  return (
    <div className="container w-full mx-auto flex flex-col gap-5 max-w-5xl">
      <MilestoneCard />
      <ActivityCard />
    </div>
  );
};

export default MilestonePage;
