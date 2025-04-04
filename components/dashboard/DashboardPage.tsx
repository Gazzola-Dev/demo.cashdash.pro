"use client";
import MilestoneCard from "@/components/dashboard/MilestoneCard";
import ProjectCard from "@/components/dashboard/ProjectCard";
import ProjectMembersCard from "@/components/dashboard/ProjectMemberCard";
import TaskListCard from "@/components/dashboard/TaskListCard";

const DashboardPage = () => {
  return (
    <div className="container w-full mx-auto flex flex-col gap-5 flex-wrap max-w-5xl">
      <div className="hidden md:flex flex-col md:flex-row gap-5 ">
        <ProjectCard />
        <MilestoneCard />
      </div>

      <TaskListCard />

      <ProjectMembersCard />

      <div className="md:hidden flex flex-col md:flex-row gap-5 ">
        <ProjectCard />
        <MilestoneCard />
      </div>
    </div>
  );
};

export default DashboardPage;
