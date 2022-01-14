import { dialog } from "electron";
import { Browser } from "./browser";
import { logger } from "./logger";
import { nody_greeter } from "./config";

const browser = new Browser();

browser.whenReady().then(() => {
  initLogger();
  logger.debug("Window is ready");
});

function initLogger(): void {
  logger.debug("Javascript logger is ready");
  for (const win of browser.windows) {
    win.window.webContents.addListener(
      "console-message",
      (ev, code, message, line, sourceID) => {
        sourceID = sourceID == "" ? "console" : sourceID;
        if (code == 3) {
          logger.log({
            level: "error",
            message: message,
            line: line,
            source: sourceID,
          });
          error_prompt(message, sourceID, line);
        } else if (code == 2) {
          logger.log({
            level: "warn",
            message: message,
            line: line,
            source: sourceID,
          });
        }
      }
    );
  }
}

/**
 * Prompts to change to default theme (gruvbox) on error
 * @param {string} message Message or error to show
 * @param {string} source Source of error
 * @param {number} line Line number where error was detected
 */
function error_prompt(message: string, source: string, line: number): void {
  if (!nody_greeter.config.greeter.detect_theme_errors) return;
  const ind = dialog.showMessageBoxSync(browser.primary_window, {
    message:
      "An error ocurred. Do you want to change to default theme? (gruvbox)",
    detail: `${source} ${line}: ${message}`,
    type: "error",
    title: "An error ocurred",
    buttons: ["Cancel", "Use default theme", "Reload theme"],
  });
  switch (ind) {
    case 0: // Cancel
      break;
    case 1: // Default theme
      nody_greeter.config.greeter.theme = "gruvbox";
      browser.load_theme();
      break;
    case 2: // Reload theme
      for (const win of browser.windows) {
        win.window.reload();
      }
      break;
    default:
      break;
  }
}

export { browser, logger, error_prompt };
