import { useEffect } from "react";
import { useRouter } from "@tanstack/react-router";

export const NotFound = () => {
  const { navigate } = useRouter();

  useEffect(() => {
    void navigate({ to: "/" });
  }, [navigate]);

  return null;
};
