import { createStore } from "@tanstack/react-store";

const MINUTE_CONSTANT = 60_000;
const SECOND_CONSTANT = 1_000;

const clockFormatter = new Intl.DateTimeFormat(undefined, {
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hour12: false,
});

const formatClock = (timestamp: number) => clockFormatter.format(new Date(timestamp));

type StoreTimer = {
  now: number;
  clockLabel: string;
  secondTick: number;
  minuteTick: number;
};

const toSecondTick = (timestamp: number) => Math.floor(timestamp / SECOND_CONSTANT);
const toMinuteTick = (timestamp: number) => Math.floor(timestamp / MINUTE_CONSTANT);

const createTimerSnapshot = (timestamp: number): StoreTimer => ({
  now: timestamp,
  clockLabel: timestamp > 0 ? formatClock(timestamp) : "",
  secondTick: toSecondTick(timestamp),
  minuteTick: toMinuteTick(timestamp),
});

export const storeTimer = createStore(createTimerSnapshot(0));

export const setTimerNow = (timestamp: number) => {
  storeTimer.setState((prev) => {
    const nextSecondTick = toSecondTick(timestamp);
    const nextMinuteTick = toMinuteTick(timestamp);

    return {
      now: prev.now === timestamp ? prev.now : timestamp,
      clockLabel: prev.now === timestamp ? prev.clockLabel : formatClock(timestamp),
      secondTick: prev.secondTick === nextSecondTick ? prev.secondTick : nextSecondTick,
      minuteTick: prev.minuteTick === nextMinuteTick ? prev.minuteTick : nextMinuteTick,
    };
  });
};
