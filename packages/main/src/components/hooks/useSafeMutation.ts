import { toast } from "@monrep/ui/base";
import { SchemaValidationError } from "@tanstack/react-db";

function toastUpsertError(error: unknown) {
  if (error instanceof SchemaValidationError) {
    toast.error(error.message);
    return;
  }
  throw error;
}

export const useSafeMutation = () => {
  return <T>(mutate: () => T) => {
    try {
      mutate();
    } catch (error) {
      toastUpsertError(error);
    }
  };
};
