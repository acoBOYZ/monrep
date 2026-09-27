import { ArrowBigDownDashIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useStickToBottomContext } from "use-stick-to-bottom";
import { Button } from "../../base/button";

export const TerminalScrollToBottomButton = () => {
  const { isAtBottom, scrollToBottom } = useStickToBottomContext();

  const handleScrollToBottom = () => {
    void scrollToBottom("instant");
  };

  if (isAtBottom) return null;

  return (
    <Button
      type="button"
      variant="secondary"
      size="icon"
      className="absolute bottom-3 left-1/2 z-20 size-8 rounded-full opacity-90 shadow-sm"
      aria-label="Scroll to bottom"
      onClick={handleScrollToBottom}
    >
      <HugeiconsIcon icon={ArrowBigDownDashIcon} className="size-4.5" aria-hidden />
    </Button>
  );
};
