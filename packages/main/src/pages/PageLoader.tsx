import { CubeLoader } from "@monrep/ui/base";

export const PageLoader = () => {
  return (
    <main className="relative inset-0 flex h-screen items-center justify-center">
      <div className="absolute inset-0 bg-background" />
      <div className="z-10 flex items-center justify-center gap-2">
        <CubeLoader className="size-5" />
        <span className="animate-pulse text-xl font-bold">monrep</span>
      </div>
    </main>
  );
};
