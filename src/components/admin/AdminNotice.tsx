type AdminNoticeProps = {
  error?: string;
  message?: string;
};

export function AdminNotice({ error, message }: AdminNoticeProps) {
  if (!error && !message) {
    return null;
  }

  return (
    <p
      className={`mb-6 rounded-xl border p-4 text-sm ${
        error
          ? "border-red-300/20 bg-red-300/10 text-red-200"
          : "border-emerald-300/20 bg-emerald-300/10 text-emerald-200"
      }`}
    >
      {error ?? message}
    </p>
  );
}
