import { Logout } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Button, TooltipTrigger } from "@monrep/ui/base";
import { useNavigate } from "@tanstack/react-router";
import { logoutFn } from "@/server/auth/functions";

export function SignOut() {
  const navigate = useNavigate();

  const signOut = async () => {
    await logoutFn();
    await navigate({ to: "/admin" });
  };

  return (
    <TooltipTrigger content="Sign out">
      <Button
        type="button"
        variant="ghost"
        size="iconxs"
        className="size-7 hover:[&>svg]:text-primary"
        onClick={signOut}
        aria-label="Sign out"
      >
        <HugeiconsIcon icon={Logout} className="size-4" aria-hidden />
      </Button>
    </TooltipTrigger>
  );
}
