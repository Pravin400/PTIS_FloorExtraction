export interface CustomBoxedInputProps {
  value: string;
  onChange: (val: string) => void;
  length: number;
  type?: "numeric" | "alphanumeric";
  groupSizes?: number[];
  showPrefix?: string;
  className?: string;
}
