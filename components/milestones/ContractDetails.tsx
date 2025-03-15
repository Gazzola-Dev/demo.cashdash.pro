import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useUpdateContract } from "@/hooks/contract.hooks";
import { formatCurrency, formatDate } from "@/lib/contract.util";
import { useAppData } from "@/stores/app.store";
import { Tables } from "@/types/database.types";
import { AlertCircle, CalendarIcon, DollarSignIcon } from "lucide-react";
import { KeyboardEvent, useEffect, useState } from "react";

type Contract = Tables<"contracts">;

export const ContractDetails = () => {
  const { contract, isAdmin } = useAppData();
  const { updateContract, isPending } = useUpdateContract();
  const [editingField, setEditingField] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    title: contract?.title || "",
    description: contract?.description || "",
    total_amount_cents: contract?.total_amount_cents || 0,
    client_name: contract?.client_name || "",
    client_company: contract?.client_company || "",
    start_date: contract?.start_date
      ? new Date(contract.start_date).toISOString().split("T")[0]
      : "",
  });

  // Update form data when contract changes
  useEffect(() => {
    if (contract) {
      setFormData({
        title: contract.title || "",
        description: contract.description || "",
        total_amount_cents: contract.total_amount_cents || 0,
        client_name: contract.client_name || "",
        client_company: contract.client_company || "",
        start_date: contract.start_date
          ? new Date(contract.start_date).toISOString().split("T")[0]
          : "",
      });
    }
  }, [contract]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === "total_amount_cents" ? parseInt(value) * 100 : value,
    }));
  };

  const handleSaveField = (fieldName: string) => {
    if (!contract || !isAdmin) return;

    // Only update if the field has changed
    let updates: Partial<Contract> = {};
    let hasChanged = false;

    switch (fieldName) {
      case "title":
        if (formData.title !== contract.title) {
          updates.title = formData.title;
          hasChanged = true;
        }
        break;
      case "description":
        if (formData.description !== contract.description) {
          updates.description = formData.description;
          hasChanged = true;
        }
        break;
      case "total_amount_cents":
        if (formData.total_amount_cents !== contract.total_amount_cents) {
          updates.total_amount_cents = formData.total_amount_cents;
          hasChanged = true;
        }
        break;
      case "client_name":
        if (formData.client_name !== contract.client_name) {
          updates.client_name = formData.client_name;
          hasChanged = true;
        }
        break;
      case "client_company":
        if (formData.client_company !== contract.client_company) {
          updates.client_company = formData.client_company;
          hasChanged = true;
        }
        break;
      case "start_date":
        if (formData.start_date) {
          const currentDate = contract.start_date
            ? new Date(contract.start_date).toISOString().split("T")[0]
            : "";

          if (formData.start_date !== currentDate) {
            updates.start_date = new Date(formData.start_date).toISOString();
            hasChanged = true;
          }
        }
        break;
    }

    if (hasChanged && contract.id) {
      updateContract(contract.id, updates);
    }

    setEditingField(null);
  };

  const handleKeyDown = (
    e: KeyboardEvent<HTMLInputElement>,
    fieldName: string,
  ) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSaveField(fieldName);
    } else if (e.key === "Escape") {
      setEditingField(null);
      // Reset form data to current contract values
      if (contract) {
        switch (fieldName) {
          case "title":
            setFormData(prev => ({ ...prev, title: contract.title || "" }));
            break;
          case "description":
            setFormData(prev => ({
              ...prev,
              description: contract.description || "",
            }));
            break;
          case "total_amount_cents":
            setFormData(prev => ({
              ...prev,
              total_amount_cents: contract.total_amount_cents || 0,
            }));
            break;
          case "client_name":
            setFormData(prev => ({
              ...prev,
              client_name: contract.client_name || "",
            }));
            break;
          case "client_company":
            setFormData(prev => ({
              ...prev,
              client_company: contract.client_company || "",
            }));
            break;
          case "start_date":
            setFormData(prev => ({
              ...prev,
              start_date: contract.start_date
                ? new Date(contract.start_date).toISOString().split("T")[0]
                : "",
            }));
            break;
        }
      }
    }
  };

  const handleBlur = (fieldName: string) => {
    handleSaveField(fieldName);
  };

  if (!contract) {
    return (
      <div className="space-y-4">
        <div className="text-sm text-muted-foreground italic">
          No contract associated with this milestone
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:justify-between space-y-2 sm:space-y-0">
        {editingField === "title" ? (
          <Input
            id="title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            onBlur={() => handleBlur("title")}
            onKeyDown={e => handleKeyDown(e, "title")}
            className="h-8 font-medium text-lg"
            autoFocus
            disabled={isPending}
          />
        ) : (
          <div
            className="font-medium text-lg cursor-text bg-gray-50/70 dark:bg-gray-900 rounded py-1 px-2"
            onClick={() => isAdmin && setEditingField("title")}
          >
            {contract.title}
          </div>
        )}

        <div className="flex items-center text-muted-foreground">
          <DollarSignIcon className="mr-2 h-4 w-4" />
          {editingField === "total_amount_cents" ? (
            <Input
              id="total_amount_cents"
              name="total_amount_cents"
              type="number"
              value={formData.total_amount_cents / 100}
              onChange={handleChange}
              onBlur={() => handleBlur("total_amount_cents")}
              onKeyDown={e => handleKeyDown(e, "total_amount_cents")}
              className="h-8 font-semibold"
              autoFocus
              disabled={isPending}
            />
          ) : (
            <span
              className="font-semibold text-foreground cursor-text bg-gray-50/70 dark:bg-gray-900 rounded py-1 px-2"
              onClick={() => isAdmin && setEditingField("total_amount_cents")}
            >
              {formatCurrency(contract.total_amount_cents / 100).slice(1)}
            </span>
          )}
        </div>
      </div>

      <Separator />

      <div className="space-y-4">
        <h3 className="text-sm font-medium">Contract Details</h3>

        <div className="flex flex-col space-y-4">
          <div className="space-y-2">
            <Label className="text-sm text-gray-500 dark:text-gray-400">
              Client Name
            </Label>
            {editingField === "client_name" ? (
              <Input
                id="client_name"
                name="client_name"
                value={formData.client_name}
                onChange={handleChange}
                onBlur={() => handleBlur("client_name")}
                onKeyDown={e => handleKeyDown(e, "client_name")}
                className="h-8"
                autoFocus
                disabled={isPending}
              />
            ) : (
              <p
                className="text-sm cursor-text bg-gray-50/70 dark:bg-gray-900 rounded py-1 px-2"
                onClick={() => isAdmin && setEditingField("client_name")}
              >
                {contract.client_name}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label className="text-sm text-gray-500 dark:text-gray-400">
              Client Company
            </Label>
            {editingField === "client_company" ? (
              <Input
                id="client_company"
                name="client_company"
                value={formData.client_company || ""}
                onChange={handleChange}
                onBlur={() => handleBlur("client_company")}
                onKeyDown={e => handleKeyDown(e, "client_company")}
                className="h-8"
                autoFocus
                disabled={isPending}
              />
            ) : (
              <p
                className="text-sm cursor-text bg-gray-50/70 dark:bg-gray-900 rounded py-1 px-2"
                onClick={() => isAdmin && setEditingField("client_company")}
              >
                {contract.client_company || (
                  <span className="text-gray-500 italic">
                    No company specified
                  </span>
                )}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label className="text-sm text-gray-500 dark:text-gray-400">
              Description
            </Label>
            {editingField === "description" ? (
              <Input
                id="description"
                name="description"
                value={formData.description || ""}
                onChange={handleChange}
                onBlur={() => handleBlur("description")}
                onKeyDown={e => handleKeyDown(e, "description")}
                className="h-8"
                autoFocus
                disabled={isPending}
              />
            ) : (
              <p
                className="text-sm cursor-text bg-gray-50/70 dark:bg-gray-900 rounded py-1 px-2"
                onClick={() => isAdmin && setEditingField("description")}
              >
                {contract.description || (
                  <span className="text-gray-500 italic">
                    No description provided
                  </span>
                )}
              </p>
            )}
          </div>

          <div className="flex items-center">
            <div className="flex-1 space-y-2">
              <Label className="text-sm text-gray-500 dark:text-gray-400">
                Start Date
              </Label>
              <div className="flex items-center">
                {editingField === "start_date" ? (
                  <Input
                    id="start_date"
                    name="start_date"
                    type="date"
                    value={formData.start_date}
                    onChange={handleChange}
                    onBlur={() => handleBlur("start_date")}
                    onKeyDown={e => handleKeyDown(e, "start_date")}
                    className="h-8 max-w-48"
                    autoFocus
                    disabled={isPending}
                  />
                ) : (
                  <div className="flex items-center">
                    <CalendarIcon className="mr-2 h-4 w-4 text-muted-foreground" />
                    <span
                      className="text-sm cursor-text bg-gray-50/70 dark:bg-gray-900 rounded py-1 px-2"
                      onClick={() => isAdmin && setEditingField("start_date")}
                    >
                      {contract.start_date ? (
                        formatDate(new Date(contract.start_date))
                      ) : (
                        <span className="text-gray-500 italic">
                          No start date set
                        </span>
                      )}
                    </span>
                  </div>
                )}
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" className="mx-4">
                        <AlertCircle className="h-4 w-4 text-amber-500" />
                        <span className="text-xs text-gray-500 group-hover:">
                          No due date
                        </span>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p className="text-sm">
                        The contract is only bound to the start date.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContractDetails;
