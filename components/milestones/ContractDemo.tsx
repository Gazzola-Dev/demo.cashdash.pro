import { Tables, TablesInsert } from "@/types/database.types";
import React from "react";
import { ContractCard } from "./ContractCard";

// Define types for our data model

export interface ContractMember extends TablesInsert<"profiles"> {
  hasApproved: boolean;
  role?: string | null;
}

export interface Contract {
  id: string;
  title?: string;
  price: number;
  startDate: Date;
  tasks: Partial<Tables<"tasks">>[];
  members: ContractMember[];
}

// Demo component with placeholder data
export const ContractCardDemo: React.FC = () => {
  // Mock current user
  const currentUser: ContractMember = {
    id: "user-1",
    display_name: "John Doe",
    email: "john.doe@example.com",
    role: "project manager",
    hasApproved: false,
  };

  // Mock contract data
  const contractData: Contract = {
    id: "contract-1",
    title: "Website Redesign Project",
    price: 15000,
    startDate: new Date(2024, 8, 15), // September 15, 2024
    tasks: [
      {
        id: "task-1",
        ordinal_id: 1,
        title: "UI Design for Homepage",
        description:
          "Create responsive UI design for the homepage including mobile, tablet, and desktop layouts. Should follow the brand guidelines and include dark/light mode variations.",
      },
      {
        id: "task-2",
        ordinal_id: 2,
        title: "Backend API Integration",
        description:
          "Integrate the frontend with the new REST API endpoints. Implement proper error handling and loading states.",
      },
      {
        id: "task-3",
        ordinal_id: 3,
        title: "Authentication System Implementation",
        description:
          "Implement JWT-based authentication system with social login options. Include password reset functionality and email verification.",
      },
      {
        id: "task-4",
        ordinal_id: 4,
        title: "Performance Optimization",
        description:
          "Optimize application performance including code splitting, lazy loading, and image optimization. Target a Lighthouse score of 90+ on all categories.",
      },
    ],
    members: [
      {
        id: "user-1",
        display_name: "John Doe",
        email: "john.doe@example.com",
        role: "project manager",
        hasApproved: false,
      },
      {
        id: "user-2",
        display_name: "Jane Smith",
        email: "jane.smith@example.com",
        role: "admin",
        hasApproved: true,
      },
      {
        id: "user-3",
        display_name: "Mike Johnson",
        email: "mike.johnson@example.com",
        role: "project manager",
        hasApproved: true,
      },
    ],
  };

  return (
    <>
      <ContractCard contract={contractData} currentUser={currentUser} />
    </>
  );
};
