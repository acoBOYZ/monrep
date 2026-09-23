type Colors = "red" | "green" | "yellow" | "blue" | "magenta" | "cyan" | "white";

const cssColors: Record<Colors, string> = {
  red: "color: red;",
  green: "color: green;",
  yellow: "color: yellow;",
  blue: "color: blue;",
  magenta: "color: magenta;",
  cyan: "color: cyan;",
  white: "color: white;",
};

class TimeLogger {
  private startTimes: Map<string, number> = new Map();

  constructor(debug: boolean) {
    if (!debug) {
      this.start = () => {};
      this.end = () => {};
      this.clear = () => {};
      this.listActiveTimers = () => {};
    }
  }

  /**
   * Starts a timer for a given label.
   * @param label - Unique label for the timer
   */
  start(label: string): void {
    if (this.startTimes.has(label)) {
      console.warn(
        `%cTimer already started for label: %c${label}`,
        cssColors.red,
        cssColors.yellow,
      );
      return;
    }
    this.startTimes.set(label, performance.now());
  }

  /**
   * Logs the elapsed time for a given label.
   * @param label - Unique label for the timer
   */
  end(label: string): void {
    const startTime = this.startTimes.get(label);
    if (startTime === undefined) {
      console.warn(
        `%cNo start time found for label: %c${label}. %cMake sure to call start(label) before end(label).`,
        cssColors.red,
        cssColors.yellow,
        cssColors.blue,
      );
      return;
    }

    const endTime = performance.now();
    const elapsedTime = endTime - startTime;

    console.log(
      `%c${label}: %c${Math.floor(elapsedTime / 1000)}s %c${(elapsedTime % 1000).toFixed(2)}ms %cat ${new Date().toLocaleTimeString()}`,
      cssColors.cyan,
      cssColors.green,
      cssColors.yellow,
      cssColors.magenta,
    );

    // Remove the timer after logging
    this.startTimes.delete(label);
  }

  /**
   * Clears a specific timer.
   * @param label - Unique label for the timer
   */
  clear(label: string): void {
    if (this.startTimes.delete(label)) {
      console.log(`%cCleared timer for label: %c${label}`, cssColors.blue, cssColors.green);
    } else {
      console.warn(`%cNo timer found for label: %c${label}`, cssColors.red, cssColors.yellow);
    }
  }

  /**
   * Lists all active timers.
   */
  listActiveTimers(): void {
    if (this.startTimes.size === 0) {
      console.log("%cNo active timers.", cssColors.green);
      return;
    }

    console.log("%cActive timers:", cssColors.yellow);
    this.startTimes.forEach((_, label) => {
      console.log(`%c- ${label}`, cssColors.cyan);
    });
  }
}

export const timeLogger = new TimeLogger(true);
