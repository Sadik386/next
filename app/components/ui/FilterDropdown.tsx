"use client";

interface FilterDropdownOption {
  label: string;
  value: string;
}

interface FilterDropdownProps {
  label: string;
  value: string;
  options: FilterDropdownOption[];
  onChange: (value: string) => void;
  allLabel?: string;
}

export default function FilterDropdown({
  label,
  value,
  options,
  onChange,
  allLabel,
}: FilterDropdownProps) {
  const allText = allLabel ?? `All ${label}`;
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      aria-label={label}
      style={{
        padding: "8px 10px",
        borderRadius: "8px",
        border: "1px solid var(--card-border)",
        backgroundColor: "var(--card-bg)",
        fontSize: "13px",
        color: "var(--text-primary)",
        outline: "none",
        minWidth: "140px",
      }}
    >
      <option value="">{allText}</option>
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}
