const TOAST_EVENT_NAME = "dms:toast";

const dispatchToast = (type, message) => {
  if (!message) return;

  window.dispatchEvent(
    new CustomEvent(TOAST_EVENT_NAME, {
      detail: {
        id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
        type,
        message,
      },
    }),
  );
};

export const emitSuccessToast = (message) => dispatchToast("success", message);
export const emitErrorToast = (message) => dispatchToast("error", message);
export const toastEventName = TOAST_EVENT_NAME;
