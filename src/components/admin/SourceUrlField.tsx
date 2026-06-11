import { adminInputClass, adminLabelClass } from "./admin-styles";

type SourceUrlFieldProps = {
  defaultValue?: string | null;
  multiple?: boolean;
};

export function SourceUrlField({
  defaultValue,
  multiple = false,
}: SourceUrlFieldProps) {
  return (
    <label className={adminLabelClass}>
      {multiple ? "Source URLs (one per line)" : "Source URL"}
      {multiple ? (
        <textarea
          className={`${adminInputClass} min-h-24 resize-y`}
          name="sourceUrls"
          defaultValue={defaultValue ?? ""}
          placeholder="https://..."
        />
      ) : (
        <input
          className={adminInputClass}
          name="sourceUrl"
          type="url"
          defaultValue={defaultValue ?? ""}
          placeholder="https://..."
        />
      )}
    </label>
  );
}
