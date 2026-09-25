import { CubeLoader } from "@monrep/ui/base";

export const PageLoader = () => {
  return (
    <main className="relative inset-0 flex h-screen items-center justify-center">
      <div className="absolute inset-0 bg-background" />
      <div className="z-10 flex items-center justify-center gap-2">
        <CubeLoader className="size-5 text-primary" />
        <span className="-translate-y-0.5 animate-pulse text-2xl leading-none font-bold tracking-tight">
          monrep
        </span>
      </div>
    </main>
  );
};
