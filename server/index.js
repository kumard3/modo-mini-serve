import express from "express";
import http from "http";
import { WebSocketServer } from "ws";
import path from "path";
import { fileURLToPath } from "url";
import LxCommunicator from "lxcommunicator";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = 3001;

let isLightOn = false;
const uuidOfLightControl = "1b394017-00e9-71fe-ffffcb0481ff57c7";

const server = http.createServer(app);
const wss = new WebSocketServer({ server });

function sendLogToClients(message) {
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify({ type: "log", message }));
    }
  });
}

// Override console.log and console.error to send logs to clients
const originalLog = console.log;
const originalError = console.error;

console.log = (...args) => {
  originalLog(...args);
  sendLogToClients(args.join(" "));
};

console.error = (...args) => {
  originalError(...args);
  sendLogToClients(`ERROR: ${args.join(" ")}`);
};

wss.on("connection", (ws) => {
  console.log("WebSocket connection established");

  ws.on("message", async (message) => {
    const command = message.toString();
    console.log("Received message from client:", command);
    if (command === "toggleLight") {
      try {
        const status = await toggleLight();
        ws.send(JSON.stringify({ type: "status", lightStatus: status }));
      } catch (error) {
        console.error("Error while toggling light:", error);
        ws.send(
          JSON.stringify({ type: "error", message: "Failed to toggle light" })
        );
      }
    }
  });

  ws.on("close", () => console.log("WebSocket connection closed"));
  ws.on("error", (error) => console.error("WebSocket error:", error));

  // Send initial light status
  ws.send(JSON.stringify({ type: "status", lightStatus: isLightOn }));
});

async function toggleLight() {
  const command = isLightOn ? "Off" : "On";
  try {
    await sendCommand(uuidOfLightControl, command);
    isLightOn = !isLightOn;
    return isLightOn;
  } catch (error) {
    console.error("Failed to toggle light:", error);
    throw error;
  }
}

async function sendCommand(uuid, command) {
  const config = new LxCommunicator.WebSocketConfig(
    LxCommunicator.WebSocketConfig.protocol.WS,
    uuid,
    "NodeJSServer",
    LxCommunicator.WebSocketConfig.permission.APP,
    false
  );

  const socket = new LxCommunicator.WebSocket(config);

  try {
    await socket.open("dns.loxonecloud.com/504F94D04BEF", "admin", "Modo@2023");
    const response = await socket.send(`jdev/sps/io/${uuid}/${command}`);

    if (response.LL && response.LL.Code === "200") {
      console.log("Command sent successfully");
    } else {
      throw new Error(
        "Command failed with response code: " +
          (response.LL ? response.LL.Code : "unknown")
      );
    }
  } finally {
    await socket.close();
  }
}

if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "/client/build")));
  app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "client", "build", "index.html"));
  });
} else {
  app.get("/", (req, res) => res.send("Hello from the server"));
}

// Use the HTTP server to listen on the port instead of the Express app
server.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
  console.log(`WebSocket server running on ws://localhost:${port}`);
});
