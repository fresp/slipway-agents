export type LogSymbol = "success" | "warning" | "error" | "info";

const symbols: Record<LogSymbol, string> = {
  success: "✓",
  warning: "⚠",
  error: "✖",
  info: "ℹ",
};

function write(symbol: LogSymbol, message: string): void {
  process.stdout.write(`${symbols[symbol]} ${message}\n`);
}

export function success(message: string): void {
  write("success", message);
}

export function warning(message: string): void {
  write("warning", message);
}

export function error(message: string): void {
  write("error", message);
}

export function info(message: string): void {
  write("info", message);
}
