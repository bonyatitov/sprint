export function GradientBackdrop() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
    >
      <div className="absolute -top-40 -left-32 h-[520px] w-[520px] rounded-full bg-accent opacity-40 blur-[120px] dark:opacity-30" />
      <div className="absolute -top-32 -right-40 h-[460px] w-[460px] rounded-full bg-danger opacity-30 blur-[120px] dark:opacity-25" />
      <div className="absolute -bottom-48 left-1/4 h-[560px] w-[560px] rounded-full bg-success opacity-25 blur-[130px] dark:opacity-20" />
      <div className="absolute top-1/3 -right-28 h-[380px] w-[380px] rounded-full bg-warning opacity-25 blur-[110px] dark:opacity-20" />
    </div>
  );
}
