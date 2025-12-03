import Image from "next/image";

export default function Logo({ className }: { className?: string }) {
  return (
    <Image
      src="/buildit-logo.png"
      alt="BuildIT Logo"
      width={100}
      height={100}
      className={`object-cover ${className}`}
    />
  );
}
