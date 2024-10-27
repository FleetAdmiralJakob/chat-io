import { Check } from "lucide-react";
import { type ReactNode } from "react";

const Badge = ({ children }: { children: ReactNode }) => {
  return (
    <p className="ml-2.5 flex rounded-sm bg-badge-white p-1 pr-2 text-sm font-medium dark:bg-badge-dark">
      {" "}
      <Check className="h-5" /> {children}
    </p>
  );
};

export default Badge;
