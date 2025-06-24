import { ReactNode, useContext } from "react";
import { SidebarContext } from "./sidebar";

type SidebarItemProps = {
  icon: ReactNode;
  text: string;
  active?: boolean;
  alert?: boolean;
  onClick?: () => void;
};

export function SidebarItem({ icon, text, active = false, alert = false, onClick }: SidebarItemProps) {
  const context = useContext(SidebarContext);
  if (!context) throw new Error("SidebarItem must be used within a Sidebar");
  const { expanded } = context;

  return (
    <li
      onClick={onClick}
      className={`
        relative flex items-center py-2 px-3 my-1
        font-medium rounded-md cursor-pointer
        transition-colors group
        focus:outline-none focus:ring-0
        ${
          active
            ? "bg-red-200 text-red-800"
            : "hover:bg-red-300 text-gray-600"
        }
      `}
    >
      {icon}
      <span
        className={`overflow-hidden transition-all ${
          expanded ? "w-52 ml-3" : "w-0"
        }`}
      >
        {text}
      </span>
      {alert && (
        <div
          className={`absolute right-2 w-2 h-2 rounded bg-red-500 ${
            expanded ? "" : "top-2"
          }`}
        />
      )}

      {!expanded && (
        <div
          className={`
            absolute left-full rounded-md px-2 py-1 ml-6
            bg-red-200 text-red-800 text-sm
            invisible opacity-20 -translate-x-3 transition-all
            group-hover:visible group-hover:opacity-100 group-hover:translate-x-0
          `}
        >
          {text}
        </div>
      )}
    </li>
  );
}
