"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import { useRouter } from "@/i18n/navigation";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

export function HomeSearchBar() {
  const router = useRouter();
  const [q, setQ] = useState("");

  function search() {
    router.push(q ? `/jobs?q=${encodeURIComponent(q)}` : "/jobs");
  }

  return (
    <div className="mx-auto mt-6 flex max-w-xl gap-2">
      <Input
        placeholder="Search job titles, e.g. Uber driver"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && search()}
      />
      <Button onClick={search}>
        <Search className="h-4 w-4" />
        Search
      </Button>
    </div>
  );
}
