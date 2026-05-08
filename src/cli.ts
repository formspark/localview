#!/usr/bin/env node

import os from "os";
import { isCancel, select } from "@clack/prompts";
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

  const selected = await select({
    message: "Select network interface",
    initialValue: candidates[0].address,
    options: candidates.map((c) => {
      const label = c.kind === "other" ? c.name : `${c.name} (${c.kind})`;
      return { value: c.address, label, hint: c.address };
    }),
  });

  if (isCancel(selected)) {
    console.log("Cancelled.");
    process.exit(0);
  }

  return selected as string;
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
