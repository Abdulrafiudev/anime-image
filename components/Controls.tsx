"use client";

import { type Controls as ControlsState, DEFAULT_CONTROLS } from "@/lib/controls";

type Props = {
  value: ControlsState;
  onChange: (next: ControlsState) => void;
};

type Field = {
  key: keyof ControlsState;
  label: string;
  hint: string;
  low: string;
  high: string;
};

const FIELDS: Field[] = [
  {
    key: "stylization",
    label: "Stylization strength",
    hint: "How far to transform from your photo.",
    low: "Subtle",
    high: "Full anime",
  },
  {
    key: "identity",
    label: "Identity preservation",
    hint: "Keep the person recognizable.",
    low: "Loose",
    high: "Faithful",
  },
  {
    key: "detail",
    label: "Line & detail",
    hint: "Crispness and intricacy of linework.",
    low: "Soft",
    high: "Crisp",
  },
  {
    key: "vibrancy",
    label: "Color vibrancy",
    hint: "Muted palette to vivid punch.",
    low: "Muted",
    high: "Vivid",
  },
];

export function Controls({ value, onChange }: Props) {
  const isDefault = (Object.keys(DEFAULT_CONTROLS) as (keyof ControlsState)[]).every(
    (k) => value[k] === DEFAULT_CONTROLS[k],
  );

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-sm font-bold uppercase tracking-wide text-muted">
          Fine controls
        </h3>
        <button
          type="button"
          onClick={() => onChange(DEFAULT_CONTROLS)}
          disabled={isDefault}
          className="text-xs font-medium text-violet transition-opacity hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-30"
        >
          Reset
        </button>
      </div>

      <div className="space-y-5">
        {FIELDS.map((field) => {
          const id = `control-${field.key}`;
          return (
            <div key={field.key}>
              <div className="mb-1.5 flex items-baseline justify-between gap-2">
                <label htmlFor={id} className="text-sm font-medium text-ink">
                  {field.label}
                </label>
                <span className="tabular-nums text-xs font-semibold text-violet">
                  {value[field.key]}
                </span>
              </div>
              <input
                id={id}
                type="range"
                min={0}
                max={100}
                step={1}
                value={value[field.key]}
                aria-describedby={`${id}-hint`}
                onChange={(e) =>
                  onChange({ ...value, [field.key]: Number(e.target.value) })
                }
              />
              <div
                id={`${id}-hint`}
                className="mt-1 flex justify-between text-[11px] text-muted"
              >
                <span>{field.low}</span>
                <span>{field.high}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
