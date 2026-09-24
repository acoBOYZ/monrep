import { Logout } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Button } from "@monrep/ui/base";
import { useNavigate } from "@tanstack/react-router";
import { logoutFn } from "@/server/auth/functions";

export function SignOut() {
  const navigate = useNavigate();

  const signOut = async () => {
    await logoutFn();
    await navigate({ to: "/admin" });
  };

  return (
    <Button
      type="button"
      variant="ghost"
      className="group/so"
      onClick={signOut}
      aria-label="Sign out"
      title="Sign out"
    >
      <HugeiconsIcon icon={Logout} className="group-hover/so:text-destructive" />
    </Button>
  );
}
