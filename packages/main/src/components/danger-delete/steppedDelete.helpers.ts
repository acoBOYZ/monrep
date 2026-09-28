import type { SyntheticEvent } from "react";

export const stopSteppedDeleteEvent = (event: SyntheticEvent) => {
  event.stopPropagation();
};
