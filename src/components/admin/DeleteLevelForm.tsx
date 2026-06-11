"use client";

import type { FormEvent } from "react";

import { adminDangerButtonClass } from "./admin-styles";

type DeleteLevelFormProps = {
  action: (formData: FormData) => void | Promise<void>;
  recordId: string;
  returnTo: string;
  label: string;
};

export function DeleteLevelForm({
  action,
  recordId,
  returnTo,
  label,
}: DeleteLevelFormProps) {
  function confirmDelete(event: FormEvent<HTMLFormElement>) {
    if (
      !window.confirm(
        `Delete ${label}? This may affect calculator results.`,
      )
    ) {
      event.preventDefault();
    }
  }

  return (
    <form action={action} onSubmit={confirmDelete}>
      <input name="recordId" type="hidden" value={recordId} />
      <input name="returnTo" type="hidden" value={returnTo} />
      <button className={adminDangerButtonClass} type="submit">
        Delete level
      </button>
    </form>
  );
}
