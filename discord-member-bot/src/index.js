import "dotenv/config";

import {
  Client,
  Events,
  GatewayIntentBits,
} from "discord.js";

const DISCORD_TOKEN = process.env.DISCORD_TOKEN;
const BACKEND_URL = process.env.BACKEND_URL;
const BOT_SECRET = process.env.BOT_SECRET;

if (!DISCORD_TOKEN) {
  throw new Error("DISCORD_TOKEN is missing from .env");
}

if (!BACKEND_URL) {
  throw new Error("BACKEND_URL is missing from .env");
}

if (!BOT_SECRET) {
  throw new Error("BOT_SECRET is missing from .env");
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
  ],
});

const incrementMemberCount = async () => {
  const response = await fetch(
    `${BACKEND_URL}/stats/member`,
    {
      method: "POST",

      headers: {
        Authorization: `Bearer ${BOT_SECRET}`,
      },
    }
  );

  if (!response.ok) {
    const message = await response.text();

    throw new Error(
      `Backend returned ${response.status}: ${message}`
    );
  }

  return response.json();
};

client.once(
  Events.ClientReady,
  (readyClient) => {
    console.log(
      `Bot online as ${readyClient.user.tag}`
    );
  }
);

client.on(
  Events.GuildMemberAdd,
  async (member) => {
    console.log(
      `Member joined: ${member.user.tag}`
    );

    try {
      const stats =
        await incrementMemberCount();

      console.log(
        `Member count updated: ${stats.member_count}`
      );
    } catch (error) {
      console.error(
        "Failed to update backend:",
        error
      );
    }
  }
);

client.login(DISCORD_TOKEN);