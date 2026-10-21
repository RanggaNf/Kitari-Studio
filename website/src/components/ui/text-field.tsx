import type { InputHTMLAttributes } from "react";

type TextFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  id: string;
  label: string;
};

export function TextField({ id, label, className = "", ...props }: TextFieldProps) {
  return (
    <label className={`field ${className}`.trim()} htmlFor={id}>
      <span>{label}</span>
      <input id={id} name={id} {...props} />
    </label>
  );
}
