import { useEffect, useState } from "react";
import { CheckCircle2, XCircle } from "lucide-react";
import { toastEventName } from "../../utils/toastEvents";

const AUTO_CLOSE_MS = 3200;

export function ToastViewport() {
  const [items, setItems] = useState([]);

  useEffect(() => {
    const onToast = (event) => {
      const toast = event.detail;
      if (!toast?.id) return;

      setItems((prev) => [...prev, toast]);

      window.setTimeout(() => {
        setItems((prev) => prev.filter((item) => item.id !== toast.id));
      }, AUTO_CLOSE_MS);
    };

    window.addEventListener(toastEventName, onToast);
    return () => window.removeEventListener(toastEventName, onToast);
  }, []);

  return (
    <div className="pointer-events-none fixed right-4 top-4 z-[100] flex w-[min(92vw,24rem)] flex-col gap-3">
      {items.map((item) => {
        const isSuccess = item.type === "success";

        return (
          <div
            key={item.id}
            className={`pointer-events-auto flex items-start gap-3 rounded-xl border px-4 py-3 shadow-lg backdrop-blur ${
              isSuccess
                ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                : "border-rose-200 bg-rose-50 text-rose-800"
            }`}
          >
            <div className="mt-0.5">
              {isSuccess ? <CheckCircle2 size={18} /> : <XCircle size={18} />}
            </div>
            <p className="text-sm font-medium leading-5">{item.message}</p>
          </div>
        );
      })}
    </div>
  );
}
