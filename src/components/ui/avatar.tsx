import Image from "next/image";
import { cn } from "@/lib/utils/cn";

interface AvatarProps {
  src?: string | null;
  label: string;
  size?: number;
  className?: string;
}

export function Avatar({ src, label, size = 36, className }: AvatarProps) {
  if (src) {
    return (
      <Image
        src={src}
        alt={label}
        width={size}
        height={size}
        className={cn("rounded-full object-cover", className)}
        style={{ width: size, height: size }}
        unoptimized
      />
    );
  }

  return (
    <div
      className={cn(
        "flex items-center justify-center rounded-full bg-indigo-100 font-semibold text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300",
        className
      )}
      style={{ width: size, height: size, fontSize: size * 0.4 }}
      aria-hidden
    >
      {label}
    </div>
  );
}
