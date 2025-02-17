#!/usr/bin/env node

const path = require("path");
const http = require("http");
const readline = require("readline");
const express = require("express");
const WebSocket = require("ws");
const open = require("open");

process.stdin.pipe(process.stdout);

const rl = readline.createInterface({
    input: process.stdin,
    terminal: false,
});

const values = [];

rl.on("line", (line) => {
    try {
        const value = JSON.parse(line);
        if (typeof value !== "object" || value === null) {
            throw new Error("Not object");
        } else {
            pushNewValue(value);
        }
    } catch (err) {
        const newValue = {
            time: Date.now(),
            package: "not-json",
            message: line,
        };
        pushNewValue(newValue);
    }
});

rl.on("close", () => {
    process.exit(0);
});

let exitOnSigInt = false;
process.on("SIGINT", () => {
    if (exitOnSigInt) {
        process.exit(0);
    } else {
        exitOnSigInt = true;
        console.log("Press Ctrl-C again to exit");
    }
});

const pushNewValue = (newValue) => {
    values.push(newValue);
    wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(newValue));
        }
    });
};

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server, path: "/api/ws" });

app.get(
    "*",
    express.static(path.join(__dirname, "..", "..", "frontend", "public")),
);

wss.on("connection", (ws) => {
    ws.send(JSON.stringify(values));
});

const port = process.env.PORT || 3001;
server.listen(port, () => {
    const url = `http://localhost:${port}`;
    console.log(`[json-log-preview] Server listening at ${url}`);
    if (process.argv.includes("--open")) {
        void open(url);
    }
});
