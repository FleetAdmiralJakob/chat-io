import { Check } from "lucide-react";
import { ReactNode } from "react";

const Badge = ({ children }: { children: ReactNode }) => {
  return (
    <p className="ml-2.5 flex rounded-sm bg-blue-400 p-1 pr-2 text-sm font-medium">
      {" "}
      <Check className="h-5" /> {children}
    </p>
  );
};

export default Badge;
