import { OpsActionsMenuContent } from "./OpsActionsMenuContent";
import type { SmartPopoverContentRenderer } from "@monrep/ui/base";
import type { OpsActionsMenuContentProps } from "./OpsActionsMenuContent";

export const createOpsActionsMenuRenderer = (
  props: Omit<OpsActionsMenuContentProps, "close">,
): SmartPopoverContentRenderer => {
  const renderOpsActionsMenuContent: SmartPopoverContentRenderer = ({ close }) => (
    <OpsActionsMenuContent {...props} close={close} />
  );
  return renderOpsActionsMenuContent;
};
