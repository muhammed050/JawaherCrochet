"use client";
import { useParams } from "next/navigation";
export default function ErrorPage({ reset }: { reset: () => void }) {
  const { locale } = useParams();
  return (
    <div className="empty-state">
      <h1>{locale === "ar" ? "تعذّر تحميل الصفحة" : "Sayfa yüklenemedi"}</h1>
      <button className="button" onClick={reset}>
        {locale === "ar" ? "المحاولة مجددًا" : "Tekrar dene"}
      </button>
    </div>
  );
}
