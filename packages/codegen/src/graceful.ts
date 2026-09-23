import { withGracefully } from "@monrep/utils/graceful";

let isShuttingDown = false;

export const gracefulShutdown = async (watchService: () => void) => {
  if (isShuttingDown) {
    console.log(`⚠️ Already shutting down...`);
    return;
  }

  isShuttingDown = true;
  console.log("\n\r🔻 Graceful shutdown initiated...");

  const tasks = [
    {
      label: `Stop watch service`,
      fn: watchService,
      timeout: 500,
    },
  ];

  try {
    await withGracefully(tasks);
  } catch {
    console.warn("⚠️ Some shutdown tasks failed silently.");
  }

  console.info(`👋 Codegen watch service terminated.`);
  process.exit(0);
};
