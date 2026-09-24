import { NetworkEnv } from "./NetworkEnv";
import { ThemeEnv } from "./ThemeEnv";
import { ViewportHost } from "./ViewportHost";
import { TimerEnv } from "./timer/TimerEnv";

export const EnvHost = () => {
  return (
    <>
      <ThemeEnv />
      <NetworkEnv />
      <ViewportHost />
      <TimerEnv />
    </>
  );
};
