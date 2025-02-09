"use client";

import {
  PriorityIcon,
  priorityOrder,
  statusOrder,
} from "@/components/tasks/StatusPriorityIcons";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import configuration from "@/configuration";
import { useGetProject } from "@/hooks/project.hooks";
import { useListTasks, useUpdateTask } from "@/hooks/task.hooks";
import { useToastQueue } from "@/hooks/useToastQueue";
import { useIsAdmin } from "@/hooks/user.hooks";
import { Tables } from "@/types/database.types";
import {
  PRIORITY_OPTIONS,
  TaskResult,
  TaskTableProps,
} from "@/types/task.types";
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
import { ArrowUpDown, GitBranch, Plus } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React from "react";
import { useDebounce } from "use-debounce";
import { AssigneeSelect } from "./AssigneeSelect";

const TaskTable = ({ projectId, projectSlug }: TaskTableProps) => {
  const router = useRouter();
  const [sorting, setSorting] = React.useState<SortingState>([
    { id: "priority", desc: true }, // Default sort by priority
  ]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    [],
  );
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [nameFilter, setNameFilter] = React.useState("");
  const isAdmin = useIsAdmin();
  const { toast } = useToastQueue();
  const { data: projectData } = useGetProject(projectSlug);
  const members = projectData?.project_members ?? [];

  // Create raw filters object
  const rawFilters = React.useMemo(
    () => ({
      projectSlug,
      sort: sorting[0]?.id as keyof Tables<"tasks"> | undefined,
      order: (sorting[0]?.desc ? "desc" : "asc") as "desc" | "asc" | undefined,
      search: nameFilter,
    }),
    [sorting, nameFilter, projectSlug],
  );

  // Debounce the filters
  const [debouncedFilters] = useDebounce(rawFilters, 300);

  const { data: tasks = [] } = useListTasks(debouncedFilters);
  const { mutate: updateTask } = useUpdateTask();

  const copyBranchName = React.useCallback(
    (task: TaskResult) => {
      const branchName = `${task.project?.prefix}-${task.task.ordinal_id}`;
      navigator.clipboard.writeText(branchName);
      toast({
        title: "Branch name copied to clipboard",
        description: branchName,
      });
    },
    [toast],
  );

  const columns = React.useMemo<ColumnDef<TaskResult>[]>(
    () => [
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
              className={isSorted ? "text-blue-600" : ""}
            >
              Title
              <ArrowUpDown
                className={`ml-2 h-4 w-4 ${isSorted ? "text-blue-600" : ""}`}
              />
            </Button>
          );
        },
        cell: ({ row }) => (
          <Link
            href={configuration.paths.tasks.view({
              project_slug: projectSlug,
              task_slug: row.original.task.slug,
            })}
            className="hover:underline cursor-pointer"
          >
            {row.getValue("title")}
          </Link>
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
          <AssigneeSelect
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
        sortingFn: (rowA, rowB) => {
          const statusA = rowA.original.task.status;
          const statusB = rowB.original.task.status;
          return statusOrder.indexOf(statusA) - statusOrder.indexOf(statusB);
        },
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
          <Select
            value={row.getValue("priority")}
            onValueChange={value => {
              updateTask({
                slug: row.original.task.slug,
                updates: { priority: value as Tables<"tasks">["priority"] },
              });
            }}
          >
            <SelectTrigger className="w-32">
              <SelectValue>
                <div className="flex items-center gap-2">
                  <PriorityIcon priority={row.getValue("priority")} />
                  <span className="capitalize">{row.getValue("priority")}</span>
                </div>
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {PRIORITY_OPTIONS.sort(
                (a, b) => priorityOrder.indexOf(a) - priorityOrder.indexOf(b),
              ).map(priority => (
                <SelectItem key={priority} value={priority}>
                  <div className="flex items-center gap-2">
                    <PriorityIcon priority={priority} />
                    <span className="capitalize">{priority}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ),
        sortingFn: (rowA, rowB) => {
          const priorityA = rowA.original.task.priority;
          const priorityB = rowB.original.task.priority;
          return (
            priorityOrder.indexOf(priorityB) - priorityOrder.indexOf(priorityA)
          );
        },
      },
      {
        id: "branch",
        accessorFn: () => null,
        cell: ({ row }) => (
          <Button
            variant="ghost"
            size="icon"
            onClick={e => {
              e.stopPropagation();
              copyBranchName(row.original);
            }}
            className="h-8 w-8"
          >
            <GitBranch className="h-4 w-4" />
          </Button>
        ),
      },
    ],
    [projectSlug, members, copyBranchName, updateTask],
  );

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

  const handleNameFilterChange = React.useCallback(
    (value: string) => {
      setNameFilter(value);
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
            value={nameFilter}
            onChange={e => handleNameFilterChange(e.target.value)}
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
