"use client";
import MilestoneCard from "@/components/dashboard/MilestoneCard";
import ProjectDetailsCard from "@/components/dashboard/ProjectDetailsCard";
import TaskListCard from "@/components/dashboard/TaskListCard";
import { useAppData } from "@/stores/app.store";

const DashboardPage = () => {
  const { isAdmin } = useAppData();
  return (
    <div className="container w-full mx-auto flex flex-col gap-5 flex-wrap max-w-5xl">
      {isAdmin && (
        <div className="flex flex-col md:flex-row gap-5 ">
          <MilestoneCard />
          <ProjectDetailsCard />
        </div>
      )}
      <TaskListCard />
    </div>
  );
};

export default DashboardPage;
