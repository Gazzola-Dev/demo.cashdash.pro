import { useListTasks, useUpdateTask } from "@/hooks/task.hooks";
import { Json, Tables } from "@/types/database.types";
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
import { ArrowUpDown, GitBranch } from "lucide-react";
import { useRouter } from "next/navigation";
import React from "react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import { useListMembers } from "@/hooks/member.hooks";
import { useToastQueue } from "@/hooks/useToastQueue";

type TaskWithRelations = {
  id: string;
  created_at: string;
  updated_at: string;
  project_id: string;
  ordinal_id: number;
  title: string;
  description: Json;
  status: Tables<"tasks">["status"];
  priority: Tables<"tasks">["priority"];
  slug: string;
  prefix: string;
  assignee: string | null;
  budget_cents: number | null;
  project: {
    id: string;
    name: string;
    slug: string;
    prefix: string;
  };
  assignee_profile: {
    id: string;
    display_name: string | null;
    avatar_url: string | null;
  } | null;
  subtasks: { count: number };
  task_tags: {
    tags: {
      id: string;
      name: string;
      color: string;
    };
  }[];
};

const STATUS_OPTIONS: Tables<"tasks">["status"][] = [
  "backlog",
  "todo",
  "in_progress",
  "in_review",
  "completed",
];
const PRIORITY_OPTIONS: Tables<"tasks">["priority"][] = [
  "low",
  "medium",
  "high",
  "urgent",
];

export default function DataTable({
  projectId,
  projectSlug,
}: {
  projectId: string;
  projectSlug: string;
}) {
  const router = useRouter();
  const { toast } = useToastQueue();
  const { mutate: updateTask } = useUpdateTask();
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    [],
  );
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});

  const { data: tasksData = [] } = useListTasks({
    projectId,
    sort: sorting[0]?.id,
    order: sorting[0]?.desc ? "desc" : "asc",
  });

  const { data: members = [] } = useListMembers(projectId);

  const tasks = tasksData as unknown as TaskWithRelations[];

  const handleRowClick = (task: TaskWithRelations, event: React.MouseEvent) => {
    // Don't navigate if clicking on an interactive element
    if ((event.target as HTMLElement).closest("button, select")) {
      return;
    }
    router.push(
      configuration.paths.tasks.view({
        project_slug: projectSlug,
        task_slug: task.slug,
      }),
    );
  };

  const copyBranchName = (task: TaskWithRelations) => {
    const branchName = `${task.project.prefix}-${task.ordinal_id}-${task.slug}`;
    navigator.clipboard.writeText(branchName);
    toast({
      title: "Branch name copied to clipboard",
      description: branchName,
    });
  };

  const columns: ColumnDef<TaskWithRelations>[] = [
    {
      accessorKey: "title",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Title
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => (
        <span className="font-normal">{row.getValue("title")}</span>
      ),
    },
    {
      accessorKey: "status",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Status
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => (
        <Select
          value={row.getValue("status")}
          onValueChange={value => {
            updateTask({
              id: row.original.id,
              updates: { status: value as Tables<"tasks">["status"] },
            });
          }}
        >
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map(status => (
              <SelectItem key={status} value={status}>
                {status.toLowerCase().replace("_", " ")}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ),
    },
    {
      accessorKey: "priority",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Priority
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => (
        <Select
          value={row.getValue("priority")}
          onValueChange={value => {
            updateTask({
              id: row.original.id,
              updates: { priority: value as Tables<"tasks">["priority"] },
            });
          }}
        >
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PRIORITY_OPTIONS.map(priority => (
              <SelectItem key={priority} value={priority}>
                {priority}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ),
    },
    {
      id: "assignee",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Assignee
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      accessorFn: row => row.assignee_profile?.display_name ?? "",
      cell: ({ row }) => (
        <Select
          value={row.original.assignee || ""}
          onValueChange={value => {
            updateTask({
              id: row.original.id,
              updates: { assignee: value || null },
            });
          }}
        >
          <SelectTrigger className="w-48">
            <SelectValue>
              {row.original.assignee_profile ? (
                <div className="flex items-center gap-2">
                  <Avatar className="h-6 w-6">
                    <AvatarImage
                      src={
                        row.original.assignee_profile.avatar_url || undefined
                      }
                    />
                    <AvatarFallback>
                      {row.original.assignee_profile.display_name?.charAt(0) ||
                        "?"}
                    </AvatarFallback>
                  </Avatar>
                  <span>
                    {row.original.assignee_profile.display_name ||
                      "Unnamed User"}
                  </span>
                </div>
              ) : (
                "Unassigned"
              )}
            </SelectValue>
          </SelectTrigger>
          {/* <SelectContent>
            <SelectItem value="">Unassigned</SelectItem>
            {members.map(member => (
              <SelectItem key={member.user.id} value={member.user.id}>
                <div className="flex items-center gap-2">
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={member.user.avatar_url || undefined} />
                    <AvatarFallback>
                      {member.user.display_name?.charAt(0) || "?"}
                    </AvatarFallback>
                  </Avatar>
                  <span>{member.user.display_name || "Unnamed User"}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent> */}
        </Select>
      ),
    },
    {
      id: "branch",
      cell: ({ row }) => (
        <Button
          variant="ghost"
          size="icon"
          onClick={() => copyBranchName(row.original)}
          className="h-8 w-8"
        >
          <GitBranch className="h-4 w-4" />
        </Button>
      ),
    },
  ];

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

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <Input
          placeholder="Filter tasks..."
          value={(table.getColumn("title")?.getFilterValue() as string) ?? ""}
          onChange={event =>
            table.getColumn("title")?.setFilterValue(event.target.value)
          }
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
              .map(column => {
                return (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    className="capitalize"
                    checked={column.getIsVisible()}
                    onCheckedChange={value => column.toggleVisibility(!!value)}
                  >
                    {column.id}
                  </DropdownMenuCheckboxItem>
                );
              })}
          </DropdownMenuContent>
        </DropdownMenu>
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
}
