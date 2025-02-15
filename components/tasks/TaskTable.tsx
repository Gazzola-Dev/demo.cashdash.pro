"use client";

import GitBranchCopy from "@/components/tasks/GitBranchCopy";
import {
  AssigneeSelectSimple,
  PrioritySelectSimple,
  StatusSelectSimple,
} from "@/components/tasks/SimpleTaskSelectComponents";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import configuration from "@/configuration";
import useAppStore from "@/hooks/app.store";
import { useUpdateTask } from "@/hooks/mutation.hooks";
import { useListTasks } from "@/hooks/query.hooks";
import { useIsAdmin } from "@/hooks/user.hooks";
import { cn } from "@/lib/utils";
import { Tables } from "@/types/database.types";
import { TaskResult, TaskTableProps } from "@/types/task.types";
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { ArrowUpDown, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import React from "react";
import { useDebounce } from "use-debounce";

const TaskTable = ({ projectId, projectSlug }: TaskTableProps) => {
  const router = useRouter();
  const { mutate: updateTask } = useUpdateTask();
  const { profile } = useAppStore();
  const projectData = profile?.current_project;

  const [sorting, setSorting] = React.useState<SortingState>([
    {
      id: "priority",
      desc: true,
    },
  ]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    [],
  );
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [titleFilter, setTitleFilter] = React.useState("");

  const isAdmin = useIsAdmin();

  // Create raw filters object
  const rawFilters = React.useMemo(
    () => ({
      projectSlug,
      sort: sorting[0]?.id as keyof Tables<"tasks"> | undefined,
      order: (sorting[0]?.desc ? "desc" : "asc") as "desc" | "asc" | undefined,
    }),
    [projectSlug, sorting],
  );

  // Debounce the filters
  const [debouncedFilters] = useDebounce(rawFilters, 300);

  const { data: tasksData = [] } = useListTasks(debouncedFilters);
  const tasks = tasksData?.filter(t => t.task.status !== "draft");

  const handleRowClick = React.useCallback(
    (task: TaskResult, event: React.MouseEvent<HTMLTableRowElement>) => {
      if ((event.target as HTMLElement).closest("button, select")) {
        return;
      }
      router.push(
        configuration.paths.tasks.view({
          project_slug: projectSlug,
          task_slug: task.task.slug,
        }),
      );
    },
    [router, projectSlug],
  );

  const columns = React.useMemo<ColumnDef<TaskResult>[]>(() => {
    const members = projectData?.project_members ?? [];
    return [
      {
        id: "title",
        accessorFn: row => row.task.title,
        header: ({ column }) => {
          const isSorted = column.getIsSorted();
          return (
            <Button
              variant="ghost"
              onClick={() =>
                column.toggleSorting(column.getIsSorted() === "asc")
              }
              className={cn(isSorted && "text-blue-600")}
            >
              Title
              <ArrowUpDown
                className={`ml-2 h-4 w-4 ${isSorted ? "text-blue-600" : ""}`}
              />
            </Button>
          );
        },
        cell: ({ row }) => (
          <span className="font-normal pl-4">{row.getValue("title")}</span>
        ),
      },
      {
        id: "status",
        accessorFn: row => row.task.status,
        header: ({ column }) => {
          const isSorted = column.getIsSorted();
          return (
            <Button
              variant="ghost"
              onClick={() =>
                column.toggleSorting(column.getIsSorted() === "asc")
              }
              className={isSorted ? "text-blue-600" : ""}
            >
              Status
              <ArrowUpDown
                className={`ml-2 h-4 w-4 ${isSorted ? "text-blue-600" : ""}`}
              />
            </Button>
          );
        },
        cell: ({ row }) => (
          <StatusSelectSimple
            value={row.getValue("status")}
            onValueChange={value => {
              updateTask({
                slug: row.original.task.slug,
                updates: { status: value as Tables<"tasks">["status"] },
              });
            }}
          />
        ),
      },
      {
        id: "priority",
        accessorFn: row => row.task.priority,
        header: ({ column }) => {
          const isSorted = column.getIsSorted();
          return (
            <Button
              variant="ghost"
              onClick={() =>
                column.toggleSorting(column.getIsSorted() === "asc")
              }
              className={isSorted ? "text-blue-600" : ""}
            >
              Priority
              <ArrowUpDown
                className={`ml-2 h-4 w-4 ${isSorted ? "text-blue-600" : ""}`}
              />
            </Button>
          );
        },
        cell: ({ row }) => (
          <PrioritySelectSimple
            value={row.getValue("priority")}
            onValueChange={value => {
              updateTask({
                slug: row.original.task.slug,
                updates: { priority: value as Tables<"tasks">["priority"] },
              });
            }}
          />
        ),
      },
      {
        id: "assignee",
        accessorFn: row => row.assignee_profile?.display_name ?? "",
        header: ({ column }) => {
          const isSorted = column.getIsSorted();
          return (
            <Button
              variant="ghost"
              onClick={() =>
                column.toggleSorting(column.getIsSorted() === "asc")
              }
              className={isSorted ? "text-blue-600" : ""}
            >
              Assignee
              <ArrowUpDown
                className={`ml-2 h-4 w-4 ${isSorted ? "text-blue-600" : ""}`}
              />
            </Button>
          );
        },
        cell: ({ row }) => (
          <AssigneeSelectSimple
            value={row.original.task.assignee}
            onValueChange={value => {
              updateTask({
                slug: row.original.task.slug,
                updates: { assignee: value === "unassigned" ? null : value },
              });
            }}
            members={members}
          />
        ),
      },
      {
        id: "branch",
        accessorFn: () => null,
        cell: ({ row }) => (
          <GitBranchCopy
            projectPrefix={projectData?.prefix}
            taskOrdinalId={row.original.task.ordinal_id}
            taskTitle={row.original.task.title}
          />
        ),
      },
    ];
  }, [projectData?.project_members, updateTask]);

  const table = useReactTable({
    data: tasks,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
    },
  });

  const handleTitleFilterChange = React.useCallback(
    (value: string) => {
      setTitleFilter(value);
      table.getColumn("title")?.setFilterValue(value);
    },
    [table],
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Input
            placeholder="Filter tasks..."
            value={titleFilter}
            onChange={e => handleTitleFilterChange(e.target.value)}
            className="max-w-sm"
          />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">Columns</Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {table
                .getAllColumns()
                .filter(column => column.getCanHide())
                .map(column => (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    className="capitalize"
                    checked={column.getIsVisible()}
                    onCheckedChange={value => column.toggleVisibility(!!value)}
                  >
                    {column.id}
                  </DropdownMenuCheckboxItem>
                ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        {isAdmin && (
          <Button
            onClick={() =>
              router.push(
                configuration.paths.tasks.new({ project_slug: projectSlug }),
              )
            }
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Task
          </Button>
        )}
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map(headerGroup => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map(header => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map(row => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  className="cursor-pointer"
                  onClick={e => handleRowClick(row.original, e)}
                >
                  {row.getVisibleCells().map(cell => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-end space-x-2 py-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
        >
          Previous
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
        >
          Next
        </Button>
      </div>
    </div>
  );
};

export default TaskTable;
