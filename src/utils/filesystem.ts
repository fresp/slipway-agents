import * as fs from "fs";
import * as path from "path";

export interface JsonReadResult {
  ok: boolean;
  value?: unknown;
  error?: string;
}

export interface OperationResult {
  ok: boolean;
  error?: string;
}

export function pathExists(filePath: string): boolean {
  return fs.existsSync(filePath);
}

export function isReadableDirectory(dirPath: string): boolean {
  try {
    return fs.statSync(dirPath).isDirectory() && isReadable(dirPath);
  } catch {
    return false;
  }
}

export function isReadable(filePath: string): boolean {
  try {
    fs.accessSync(filePath, fs.constants.R_OK);
    return true;
  } catch {
    return false;
  }
}

export function ensureDirectory(dirPath: string): OperationResult {
  try {
    fs.mkdirSync(dirPath, { recursive: true });
    return { ok: true };
  } catch (error) {
    return { ok: false, error: getErrorMessage(error) };
  }
}

export function readTextFile(filePath: string): { ok: boolean; value?: string; error?: string } {
  try {
    return { ok: true, value: fs.readFileSync(filePath, "utf-8") };
  } catch (error) {
    return { ok: false, error: getErrorMessage(error) };
  }
}

export function readJsonFile(filePath: string): JsonReadResult {
  const text = readTextFile(filePath);
  if (!text.ok) {
    return { ok: false, error: text.error };
  }

  try {
    return { ok: true, value: JSON.parse(text.value ?? "") };
  } catch (error) {
    return { ok: false, error: getErrorMessage(error) };
  }
}

export function writeJsonFile(filePath: string, value: unknown): OperationResult {
  try {
    fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf-8");
    return { ok: true };
  } catch (error) {
    return { ok: false, error: getErrorMessage(error) };
  }
}

export function copyFile(source: string, destination: string): OperationResult {
  try {
    fs.copyFileSync(source, destination);
    return { ok: true };
  } catch (error) {
    return { ok: false, error: getErrorMessage(error) };
  }
}

export function removeFile(filePath: string): OperationResult {
  try {
    fs.rmSync(filePath, { force: true });
    return { ok: true };
  } catch (error) {
    return { ok: false, error: getErrorMessage(error) };
  }
}

export function removeDirectory(dirPath: string): OperationResult {
  try {
    fs.rmSync(dirPath, { recursive: true, force: true });
    return { ok: true };
  } catch (error) {
    return { ok: false, error: getErrorMessage(error) };
  }
}

export function backupFile(filePath: string, label: string): { ok: boolean; path?: string; error?: string } {
  if (!pathExists(filePath)) {
    return { ok: true };
  }

  const ext = path.extname(filePath);
  const base = path.basename(filePath, ext);
  const backupPath = path.join(path.dirname(filePath), `${base}-${label}-${timestamp()}${ext}`);
  const copied = copyFile(filePath, backupPath);

  return copied.ok ? { ok: true, path: backupPath } : copied;
}

function timestamp(): string {
  const now = new Date();
  const pad = (value: number): string => String(value).padStart(2, "0");
  return `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(
    now.getHours()
  )}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
