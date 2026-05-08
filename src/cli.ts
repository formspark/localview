#!/usr/bin/env node

import os from "os";
import readline from "readline";
import yargs from "yargs/yargs";
import { hideBin } from "yargs/helpers";
import qrcode from "qrcode-terminal";
import pjson from "../package.json";

console.log(`localview v${pjson.version}`);

const argv = yargs(hideBin(process.argv))
  .option("port", {
    alias: "P",
    type: "number",
    describe: "Port exposed by the local server",
  })
  .option("path", {
    type: "string",
    describe: "Path appended to the URL (e.g. /admin)",
    default: "",
  })
  .option("host", {
    type: "string",
    describe: "Override the auto-detected LAN IP",
  })
  .parseSync();

const port = argv.port;
const path = normalizePath(argv.path);

if (
  typeof port !== "number" ||
  !Number.isInteger(port) ||
  port < 1 ||
  port > 65535
) {
  console.log("Missing or invalid port argument.");
  console.log("Correct usage: localview --port 8080");
  process.exit(1);
}

async function main() {
  const address = argv.host ? argv.host : await pickAddress();

  if (!address) {
    console.log("Could not determine a non-internal IPv4 address.");
    process.exit(1);
  }

  const url = `http://${address}:${port}${path}`;
  qrcode.setErrorLevel("H");
  qrcode.generate(url, { small: true }, (code) => {
    console.log(`Port: ${port}`);
    console.log(`URL: ${url}`);
    console.log("");
    console.log(code);
    console.log(
      "To visit the exposed URL, scan the QR code with your mobile device.",
    );
  });
}

async function pickAddress(): Promise<string | null> {
  const candidates = collectLanAddresses();
  if (candidates.length === 0) return null;
  if (candidates.length === 1) return candidates[0].address;

  if (!process.stdin.isTTY) {
    const first = candidates[0];
    console.log(
      `Multiple interfaces detected; defaulting to ${first.name} (${first.address}).`,
    );
    return first.address;
  }

  console.log("Multiple network interfaces detected:");
  candidates.forEach((c, i) => {
    const label = c.kind === "other" ? "" : ` (${c.kind})`;
    console.log(`  ${i + 1}. ${c.name}${label} — ${c.address}`);
  });
  const answer = await prompt(
    `Select interface [1-${candidates.length}] (default: 1): `,
  );
  const trimmed = answer.trim();
  const choice = trimmed === "" ? 1 : Number(trimmed);
  if (!Number.isInteger(choice) || choice < 1 || choice > candidates.length) {
    console.log("Invalid selection.");
    process.exit(1);
  }
  return candidates[choice - 1].address;
}

function prompt(question: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

function normalizePath(value: string): string {
  if (!value) return "";
  return value.startsWith("/") ? value : `/${value}`;
}

type InterfaceKind = "wifi" | "ethernet" | "vpn" | "virtual" | "other";
type Candidate = { name: string; address: string; kind: InterfaceKind };

const KIND_PRIORITY: Record<InterfaceKind, number> = {
  wifi: 0,
  ethernet: 1,
  other: 2,
  vpn: 3,
  virtual: 4,
};

function collectLanAddresses(): Candidate[] {
  const interfaces = os.networkInterfaces();
  const result: Candidate[] = [];
  for (const name of Object.keys(interfaces)) {
    const ifaces = interfaces[name];
    if (!ifaces) continue;
    for (const iface of ifaces) {
      if (iface.family === "IPv4" && !iface.internal) {
        result.push({ name, address: iface.address, kind: classify(name) });
      }
    }
  }
  result.sort((a, b) => KIND_PRIORITY[a.kind] - KIND_PRIORITY[b.kind]);
  return result;
}

function classify(name: string): InterfaceKind {
  const n = name.toLowerCase();
  if (/^(wlan|wlp|wlo|wifi)/.test(n) || n.startsWith("wi-fi")) return "wifi";
  if (/^(eth|enp|eno|ens|en\d)/.test(n) || n.startsWith("ethernet"))
    return "ethernet";
  if (/^(tailscale|tun|tap|utun|wg|ppp|ipsec|gpd)/.test(n)) return "vpn";
  if (/^(docker|br-|veth|vmnet|vboxnet|virbr|bridge)/.test(n)) return "virtual";
  return "other";
}

main();
