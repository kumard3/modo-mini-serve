import express from "express";
import http from "http";
import { WebSocketServer, WebSocket } from "ws";
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

function log(message) {
  console.log(message);
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify({ type: "log", message }));
    }
  });
}

wss.on("connection", (ws) => {
  log("WebSocket connection established");

  // Send initial light status
  ws.send(JSON.stringify({ type: "status", lightStatus: isLightOn }));
  log(`Initial light status sent: ${isLightOn ? "On" : "Off"}`);

  ws.on("message", async (message) => {
    const command = message.toString();
    log(`Received message from client: ${command}`);
    if (command === "toggleLight") {
      try {
        const status = await toggleLight();
        wss.clients.forEach((client) => {
          if (client.readyState === WebSocket.OPEN) {
            client.send(
              JSON.stringify({ type: "status", lightStatus: status })
            );
          }
        });
        log(`Light toggled: ${status ? "On" : "Off"}`);
      } catch (error) {
        log(`Error while toggling light: ${error.message}`);
        ws.send(
          JSON.stringify({ type: "error", message: "Failed to toggle light" })
        );
      }
    }
  });

  ws.on("close", () => log("WebSocket connection closed"));
  ws.on("error", (error) => log(`WebSocket error: ${error.message}`));
});

async function toggleLight() {
  const command = isLightOn ? "Off" : "On";
  try {
    await sendCommand(uuidOfLightControl, command);
    isLightOn = !isLightOn;
    return isLightOn;
  } catch (error) {
    log(`Failed to toggle light: ${error.message}`);
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
      log("Command sent successfully");
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

server.listen(port, () => {
  log(`Server running on http://localhost:${port}`);
  log(`WebSocket server running on ws://localhost:${port}`);
});
