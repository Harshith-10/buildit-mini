import ThemeToggle from "@/components/common/theme-toggle";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="absolute w-screen h-screen flex items-center justify-center">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <div className="relative min-w-[400px]">{children}</div>
    </div>
  );
}
