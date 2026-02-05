"use client";

import type { DemoMeta, DemoControl } from "@/lib/demo-registry";

type Props = {
  demo: DemoMeta;
  config: Record<string, string | number | boolean>;
  onChange: (next: Record<string, string | number | boolean>) => void;
};

function updateConfig(
  config: Record<string, string | number | boolean>,
  key: string,
  value: string | number | boolean,
) {
  return { ...config, [key]: value };
}

export default function ControlsPanel({ demo, config, onChange }: Props) {
  if (!demo.controls || demo.controls.length === 0) {
    return <p className="card-desc">No configurable controls yet.</p>;
  }

  return (
    <div className="demo-controls">
      {demo.controls.map((control) => (
        <ControlField
          key={control.key}
          control={control}
          value={config[control.key]}
          onValueChange={(value) => onChange(updateConfig(config, control.key, value))}
        />
      ))}
    </div>
  );
}

function ControlField({
  control,
  value,
  onValueChange,
}: {
  control: DemoControl;
  value: string | number | boolean | undefined;
  onValueChange: (value: string | number | boolean) => void;
}) {
  if (control.type === "range") {
    const numberValue = typeof value === "number" ? value : control.min;
    return (
      <label className="control">
        <span>
          {control.label}: {numberValue}
        </span>
        <input
          type="range"
          min={control.min}
          max={control.max}
          step={control.step}
          value={numberValue}
          onChange={(event) => onValueChange(Number(event.target.value))}
        />
      </label>
    );
  }

  if (control.type === "color") {
    const colorValue = typeof value === "string" ? value : "#ffffff";
    return (
      <label className="control">
        <span>{control.label}</span>
        <input type="color" value={colorValue} onChange={(event) => onValueChange(event.target.value)} />
      </label>
    );
  }

  if (control.type === "select") {
    const selectValue = typeof value === "string" ? value : control.options[0]?.value ?? "";
    return (
      <label className="control">
        <span>{control.label}</span>
        <select value={selectValue} onChange={(event) => onValueChange(event.target.value)}>
          {control.options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
    );
  }

  const boolValue = typeof value === "boolean" ? value : false;
  return (
    <label className="control">
      <span>{control.label}</span>
      <input
        type="checkbox"
        checked={boolValue}
        onChange={(event) => onValueChange(event.target.checked)}
      />
    </label>
  );
}
