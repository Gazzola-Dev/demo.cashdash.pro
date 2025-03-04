"use client";
import ProjectDetailsCard from "@/components/dashboard/ProjectDetailsCard";
import TaskListCard from "@/components/dashboard/TaskListCard";

const DashboardPage = () => {
  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-9">
          <TaskListCard />
        </div>
        <div className="col-span-3">
          <ProjectDetailsCard />
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
