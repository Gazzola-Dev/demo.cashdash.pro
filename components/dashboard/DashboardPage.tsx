"use client";

import TaskListCard from "@/components/dashboard/TaskListCard";

const DashboardPage = () => {
  // Simple milestone due date
  const milestoneDueDate = "23-Feb-25";

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="grid grid-cols-12 gap-6">
        {/* TaskListCard - Spans 8 columns */}
        <div className="col-span-9">
          <TaskListCard />
        </div>

        {/* TaskPriorityCard - Spans 4 columns */}
        <div className="col-span-4">
          {/* <TaskPriorityCard tasks={tasks} /> */}
        </div>
      </div>

      {/* ProgressCard - Full width */}
      <div className="w-full">{/* <ProgressCard tasks={tasks} /> */}</div>

      {/* GanttCard - Full width */}
      <div className="w-full">{/* <GanttCard tasks={tasks} /> */}</div>
    </div>
  );
};

export default DashboardPage;
