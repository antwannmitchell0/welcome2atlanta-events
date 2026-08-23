import type { ReactNode } from "react";

const control =
  "h-12 w-full rounded-md border border-border bg-elevated px-4 text-fg placeholder:text-subtle outline-none focus:border-gold";

export function Field({
  label,
  name,
  type = "text",
  required,
  placeholder,
  defaultValue,
  autoComplete,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  placeholder?: string;
  defaultValue?: string;
  autoComplete?: string;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm text-muted">
        {label}
        {required ? <span className="text-live"> *</span> : null}
      </span>
      <input
        name={name}
        type={type}
        required={required}
        placeholder={placeholder}
        defaultValue={defaultValue}
        autoComplete={autoComplete}
        className={control}
      />
    </label>
  );
}

export function Area({
  label,
  name,
  placeholder,
  rows = 4,
}: {
  label: string;
  name: string;
  placeholder?: string;
  rows?: number;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm text-muted">{label}</span>
      <textarea
        name={name}
        rows={rows}
        placeholder={placeholder}
        className="w-full rounded-md border border-border bg-elevated px-4 py-3 text-fg placeholder:text-subtle outline-none focus:border-gold"
      />
    </label>
  );
}

export function SelectField({
  label,
  name,
  children,
  required,
  defaultValue,
}: {
  label: string;
  name: string;
  children: ReactNode;
  required?: boolean;
  defaultValue?: string;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm text-muted">
        {label}
        {required ? <span className="text-live"> *</span> : null}
      </span>
      <select name={name} required={required} defaultValue={defaultValue} className={control}>
        {children}
      </select>
    </label>
  );
}

export function Honeypot() {
  return (
    <div className="absolute -left-[9999px] h-0 w-0 overflow-hidden" aria-hidden="true">
      <label>
        Website
        <input name="website" type="text" tabIndex={-1} autoComplete="off" />
      </label>
    </div>
  );
}
