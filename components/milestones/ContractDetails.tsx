import { Separator } from "@/components/ui/separator";
import { formatCurrency, formatDate } from "@/lib/contract.util";
import { CalendarIcon, DollarSignIcon } from "lucide-react";
import React from "react";

interface ContractDetailsProps {
  price: number;
  startDate: Date;
  title?: string;
}

export const ContractDetails: React.FC<ContractDetailsProps> = ({
  price,
  startDate,
  title,
}) => {
  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:justify-between space-y-2 sm:space-y-0">
        {title && <div className="font-medium text-lg">{title}</div>}
        <div className="flex items-center text-muted-foreground">
          <DollarSignIcon className="mr-2 h-4 w-4" />
          <span className="font-semibold text-foreground">
            {formatCurrency(price)}
          </span>
        </div>
      </div>

      <Separator />

      <div className="space-y-4">
        <h3 className="text-sm font-medium">Contract Details</h3>

        <div className="flex flex-col space-y-2">
          <div className="flex items-center">
            <CalendarIcon className="mr-2 h-4 w-4 text-muted-foreground" />
            <span className="text-sm">
              <span className="font-medium">Start Date:</span>{" "}
              {formatDate(startDate)}
            </span>
          </div>

          <div className="text-sm text-muted-foreground mt-2 italic">
            Note: The contract is only bound to the start date. Due dates are
            only guidelines as development is not predictable enough to provide
            a fixed completion date.
          </div>
        </div>
      </div>
    </div>
  );
};
