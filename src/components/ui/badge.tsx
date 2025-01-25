import { Check } from "lucide-react";
import { type ReactNode } from "react";

const Badge = ({ children }: { children: ReactNode }) => {
  return (
    <p className="bg-badge-white dark:bg-badge-dark ml-2.5 flex rounded-xs p-1 pr-2 text-sm font-medium">
      {" "}
      <Check className="h-5" /> {children}
    </p>
  );
};

export default Badge;
