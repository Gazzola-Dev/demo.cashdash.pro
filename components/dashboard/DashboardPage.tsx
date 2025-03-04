"use client";
import MilestoneCard from "@/components/dashboard/MilestoneCard";
import ProjectDetailsCard from "@/components/dashboard/ProjectDetailsCard";
import TaskListCard from "@/components/dashboard/TaskListCard";

import { useIsMobile } from "@/hooks/use-mobile";

const DashboardPage = () => {
  const isMobile = useIsMobile();

  return (
    <div className="container mx-auto p-4 space-y-6">
      {isMobile ? (
        // Mobile layout (vertical column)
        <div className="flex flex-col space-y-6">
          <MilestoneCard />
          <div className="h-[calc(100vh-300px)]">
            <TaskListCard />
          </div>
          <ProjectDetailsCard />
        </div>
      ) : (
        // Desktop layout (split grid)
        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-9 space-y-6">
            <TaskListCard />
          </div>
          <div className="col-span-3 space-y-6">
            <ProjectDetailsCard />
            <MilestoneCard />
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardPage;
