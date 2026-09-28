import { RightClickMenuContent } from "./right-click-menu-content";
import type { SmartPopoverContentRenderer } from "../../base/smart-popover/popover.store";
import type { RightClickMenuItem } from "./right-click-menu-item";

export const createRightClickMenuContentRenderer = (
  menuItems: Array<RightClickMenuItem>,
  disabled?: boolean,
): SmartPopoverContentRenderer => {
  const renderRightClickMenuContent: SmartPopoverContentRenderer = ({ close }) => (
    <RightClickMenuContent menuItems={menuItems} disabled={disabled} onClose={close} />
  );
  return renderRightClickMenuContent;
};
