"use client";
import MilestoneCard from "@/components/dashboard/MilestoneCard";
import ProjectDetailsCard from "@/components/dashboard/ProjectDetailsCard";
import TaskListCard from "@/components/dashboard/TaskListCard";

const DashboardPage = () => {
  return (
    <div className="container mx-auto p-4 space-y-6">
      {/* Responsive grid layout that adapts to different screen sizes */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* MilestoneCard takes full width on mobile, 4 columns on desktop */}
        <div className="md:col-span-4 order-1">
          <MilestoneCard />
        </div>

        {/* TaskListCard takes full width on mobile, 8 columns on desktop */}
        <div className="md:col-span-8 order-3 md:order-2">
          <TaskListCard />
        </div>

        {/* ProjectDetailsCard takes full width on mobile, 4 columns on desktop */}
        <div className="md:col-span-4 order-2 md:order-3">
          <ProjectDetailsCard />
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
