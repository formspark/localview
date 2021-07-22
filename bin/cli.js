#!/usr/bin/env node

"use strict";

const pjson = require("../package.json");
const dns = require("dns");
const os = require("os");
const yargs = require("yargs/yargs");
const { hideBin } = require("yargs/helpers");
const qrcode = require("qrcode-terminal");

console.log(`localview v${pjson.version}`);

const argv = yargs(hideBin(process.argv)).argv;
const port = argv.port || argv.P;

if (!port) {
  console.log("Missing port argument.");
  console.log("Correct usage: localview --port 8080");
} else {
  dns.lookup(os.hostname(), async (error, address) => {
    const url = `http://${address}:${port}`;
    qrcode.setErrorLevel("H");
    qrcode.generate(url, { small: true }, async (code) => {
      console.log(`Port: ${port}`);
      console.log(`URL: ${url}`);
      console.log("");
      console.log(code);
      console.log("Scan the above QR code to visit the exposed URL.");
    });
  });
}
