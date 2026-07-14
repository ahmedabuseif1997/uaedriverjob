import { PublicHeader } from "@/components/forms/PublicHeader";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-1 flex-col">
      <PublicHeader />
      {children}
    </div>
  );
}
