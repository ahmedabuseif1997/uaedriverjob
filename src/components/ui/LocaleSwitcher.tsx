"use client";

import { useLocale } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";

export function LocaleSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  function switchTo(next: "en" | "ar") {
    router.replace(pathname, { locale: next });
  }

  return (
    <div className="flex items-center gap-1 text-sm">
      <button
        onClick={() => switchTo("en")}
        className={locale === "en" ? "font-semibold" : "text-neutral-400"}
        aria-current={locale === "en"}
      >
        EN
      </button>
      <span className="text-neutral-300">/</span>
      <button
        onClick={() => switchTo("ar")}
        className={locale === "ar" ? "font-semibold" : "text-neutral-400"}
        aria-current={locale === "ar"}
      >
        عربي
      </button>
    </div>
  );
}
