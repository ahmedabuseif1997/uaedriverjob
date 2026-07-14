import { useTranslations } from "next-intl";

export default function HomePage() {
  const t = useTranslations("common");

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
      <h1 className="text-3xl font-bold">{t("appName")}</h1>
      <p className="text-neutral-500">Scaffold is up. Build in progress.</p>
    </main>
  );
}
