"use client";

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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import configuration from "@/configuration";
import { useListProjects } from "@/hooks/project.hooks";
import { useIsAdmin } from "@/hooks/user.hooks";
import { Tables } from "@/types/database.types";
import { ProjectWithDetails } from "@/types/project.types";
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

type Project = Tables<"projects">;

const ProjectTable = () => {
  const router = useRouter();
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    [],
  );
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [nameFilter, setNameFilter] = React.useState("");
  const isAdmin = useIsAdmin();

  // Create raw filters object
  const rawFilters = React.useMemo(
    () => ({
      sort: sorting[0]?.id as keyof Project | undefined,
      order: (sorting[0]?.desc ? "desc" : "asc") as "desc" | "asc" | undefined,
      search: nameFilter,
    }),
    [sorting, nameFilter],
  );

  // Debounce the filters
  const [debouncedFilters] = useDebounce(rawFilters, 300);

  const { data: projects = [] } = useListProjects(debouncedFilters);

  const columns = React.useMemo<ColumnDef<ProjectWithDetails>[]>(
    () => [
      {
        id: "name",
        accessorKey: "name",
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
              Name
              <ArrowUpDown
                className={`ml-2 h-4 w-4 ${isSorted ? "text-blue-600" : ""}`}
              />
            </Button>
          );
        },
      },
      {
        id: "status",
        accessorKey: "status",
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
          <span className="capitalize">{row.getValue("status")}</span>
        ),
      },
      {
        id: "members",
        accessorFn: row => row.project_members?.length || 0,
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
              Members
              <ArrowUpDown
                className={`ml-2 h-4 w-4 ${isSorted ? "text-blue-600" : ""}`}
              />
            </Button>
          );
        },
        cell: ({ row }) => {
          const members = row.original.project_members || [];
          return (
            <div className="flex -space-x-2 overflow-hidden">
              {members.slice(0, 3).map((member, index) => (
                <Avatar
                  key={member.id + index}
                  className="inline-block border-2 border-background"
                >
                  <AvatarImage
                    src={member.profile?.avatar_url || undefined}
                    alt={member.profile?.display_name || "Member"}
                  />
                  <AvatarFallback>
                    {member.profile?.display_name?.charAt(0) || "?"}
                  </AvatarFallback>
                </Avatar>
              ))}
              {members.length > 3 && (
                <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-background bg-muted text-xs font-medium">
                  +{members.length - 3}
                </div>
              )}
            </div>
          );
        },
      },
      {
        id: "tasks",
        accessorFn: row => row.tasks?.length || 0,
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
              Tasks
              <ArrowUpDown
                className={`ml-2 h-4 w-4 ${isSorted ? "text-blue-600" : ""}`}
              />
            </Button>
          );
        },
      },
      {
        id: "created_at",
        accessorKey: "created_at",
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
              Created
              <ArrowUpDown
                className={`ml-2 h-4 w-4 ${isSorted ? "text-blue-600" : ""}`}
              />
            </Button>
          );
        },
        cell: ({ row }) => (
          <span>
            {new Date(row.getValue("created_at")).toLocaleDateString()}
          </span>
        ),
      },
    ],
    [],
  );

  const table = useReactTable({
    data: projects,
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
      table.getColumn("name")?.setFilterValue(value);
    },
    [table],
  );

  const handleRowClick = React.useCallback(
    (project: ProjectWithDetails) => {
      router.push(
        configuration.paths.project.overview({ project_slug: project.slug }),
      );
    },
    [router],
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Input
            placeholder="Filter projects..."
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
          <Button onClick={() => router.push(configuration.paths.project.new)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Project
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
                  onClick={() => handleRowClick(row.original)}
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

export default ProjectTable;
