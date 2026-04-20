const express = require("express");
const cors = require("cors");
const { Client } = require("@xhayper/discord-rpc");
const SysTray = require("systray2").default;
const path = require("path");
const fs = require("fs");
require("dotenv").config({ path: path.join(process.cwd(), ".env") });

const CLIENT_ID = process.env.CLIENT_ID;
const PORT = process.env.PORT;
const RECONNECT_INTERVAL = 10000;

let rpc = null;
let rpcReady = false;
let currentActivity = null;
let clearTimer = null;
let reconnectTimer = null;

function createRPCClient() {
  return new Client({ clientId: CLIENT_ID });
}

function scheduleReconnect() {
  if (reconnectTimer) return; // already scheduled
  rpcReady = false;
  reconnectTimer = setTimeout(() => {
    reconnectTimer = null;
    connectRPC();
  }, RECONNECT_INTERVAL);
}

async function connectRPC() {
  rpc = createRPCClient();

  rpc.on("ready", () => {
    console.log(`✅ Discord RPC connected as: ${rpc.user.username}`);
    rpcReady = true;

    // Re-apply whatever was showing before the disconnect
    if (currentActivity) {
      setActivity(currentActivity);
    }
  });

  rpc.on("disconnected", () => {
    console.log("⚠️  Discord disconnected — will retry in 10s...");
    scheduleReconnect();
  });

  try {
    await rpc.login();
  } catch (e) {
    console.error("❌ Discord RPC connection failed:", e.message);
    console.log("   → Make sure Discord is running. Retrying in 10s...");
    scheduleReconnect();
  }
}

async function setActivity(data) {
  if (!rpcReady) {
    currentActivity = data; // queue it, will be applied on next ready
    return;
  }

  try {
    await rpc.user?.setActivity({
      details: truncate(data.title, 128),
      type: 0,
      state: data.chapterNum
        ? truncate(data.chapterNum + (data.chapterTitle ? ` — ${data.chapterTitle}` : ""), 128)
        : (data.type === "browsing" ? "Browsing manga" : "Reading"),
      startTimestamp: data.startTimestamp,
      largeImageKey: data.coverUrl || "mangadex_logo",
      largeImageText: truncate(data.title, 128),
      smallImageKey: data.type === "reading" ? "reading_icon" : "browsing_icon",
      smallImageText: data.type === "reading" ? "Reading" : "Browsing",
      buttons: [
        {
          label: "View on MangaDex",
          url: data.chapterNum && data.chapterId
            ? `https://mangadex.org/chapter/${data.chapterId}`
            : `https://mangadex.org/title/${data.mangaId}`,
        },
        {
          label: "View project on GitHub",
          url: `https://github.com/NorthKy/mdx-rpc`
        },
      ],
      instance: false,
    });
    console.log(`🎮 Presence updated: ${data.title} — ${data.chapterNum || "Browsing"}`);
  } catch (e) {
    console.error("❌ Failed to set activity:", e.message);

    if (!reconnectTimer) scheduleReconnect();
  }
}

async function clearActivity() {
  if (!rpcReady) return;
  try {
    await rpc.user?.clearActivity();
    console.log("🔕 Presence cleared");
  } catch (e) {
    console.error("Failed to clear activity:", e.message);
  }
}

function truncate(str, max) {
  if (!str) return "";
  return str.length > max ? str.slice(0, max - 3) + "..." : str;
}

const app = express();
app.use(cors({ origin: "*" }));
app.use(express.json());

app.get("/status", (req, res) => {
  res.json({ status: "ok", rpcConnected: rpcReady, currentTitle: currentActivity?.title ?? null });
});

app.post("/update", async (req, res) => {
  const data = req.body;
  currentActivity = data;
  if (clearTimer) { clearTimeout(clearTimer); clearTimer = null; }
  await setActivity(data);
  res.json({ ok: true });
});

app.post("/clear", async (req, res) => {
  currentActivity = null;
  clearTimer = setTimeout(async () => { await clearActivity(); clearTimer = null; }, 10000);
  res.json({ ok: true });
});

app.listen(PORT, "127.0.0.1", () => {
  console.log(`🌐 HTTP server listening on 127.0.0.1:${PORT}`);
});


function getIconBase64() {
  const ico = path.join(process.cwd(), "favicon.ico");
  if (fs.existsSync(ico)) {
    return fs.readFileSync(ico).toString("base64");
  }
  return "AAABAAEAAQEAAAEAGAAoAAAAFgAAACgAAAABAAAAAgAAAAEAGAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA";
}

const ITEMS = { EXIT: 0 };

function createTray() {
  const tray = new SysTray({
    menu: {
      icon: getIconBase64(),
      title: "",
      tooltip: "MangaDex Discord Presence — Running",
      items: [
        {
          title: "Exit",
          tooltip: "Stop the app and clear Discord presence",
          checked: false,
          enabled: true,
        },
      ],
    },
    debug: false,
    copyDir: true,
  });

  tray.onClick((action) => {
    if (action.seq_id === ITEMS.EXIT) {
      tray.kill(false);
      clearActivity().finally(() => process.exit(0));
    }
  });
}

connectRPC();
setTimeout(() => {
  try {
    createTray();
    console.log("Tray created");
  } catch (e) {
    console.error("Tray failed:", e);
  }
}, 1000);
