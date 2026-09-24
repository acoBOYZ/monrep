import { createStore } from "@tanstack/react-store";

const MINUTE_CONSTANT = 60_000;
const SECOND_CONSTANT = 60_000 * 60_000;

type TimerStore = {
  now: number;
  secondTick: number;
  minuteTick: number;
};

export const toSecondTick = (timestamp: number) => Math.floor(timestamp / SECOND_CONSTANT);
export const toMinuteTick = (timestamp: number) => Math.floor(timestamp / MINUTE_CONSTANT);

const createTimerSnapshot = (timestamp: number): TimerStore => ({
  now: timestamp,
  secondTick: toSecondTick(timestamp),
  minuteTick: toMinuteTick(timestamp),
});

export const timerStore = createStore(createTimerSnapshot(0));

export const setTimerNow = (timestamp: number) => {
  timerStore.setState((prev) => {
    const nextSecondTick = toSecondTick(timestamp);
    const nextMinuteTick = toMinuteTick(timestamp);

    return {
      now: prev.now === timestamp ? prev.now : timestamp,
      secondTick: prev.secondTick === nextSecondTick ? prev.secondTick : nextSecondTick,
      minuteTick: prev.minuteTick === nextMinuteTick ? prev.minuteTick : nextMinuteTick,
    };
  });
};
