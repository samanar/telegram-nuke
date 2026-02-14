import { TelegramClient } from "telegram";
import { StringSession } from "telegram/sessions/index.js";
import { Api } from "telegram/tl/index.js";
import input from "input";
import fs from "fs";
import "dotenv/config";

// ===== YOUR API CREDENTIALS =====
const apiId = parseInt(process.env.API_ID);
const apiHash = process.env.API_HASH;

// Folder you want to KEEP
const TARGET_FOLDER_NAME = "keep";

const SESSION_FILE = "session.txt";

// Sleep function to avoid rate limiting
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Load existing session or create new one
let sessionString = "";
if (fs.existsSync(SESSION_FILE)) {
  sessionString = fs.readFileSync(SESSION_FILE, "utf-8").trim();
  console.log("Loaded existing session.");
}

const stringSession = new StringSession(sessionString);

(async () => {
  const client = new TelegramClient(stringSession, apiId, apiHash, {
    connectionRetries: 5,
  });

  await client.start({
    phoneNumber: process.env.PHONE_NUMBER,
    password: async () => await input.text("2FA Password: "),
    phoneCode: async () => await input.text("Code: "),
    onError: (err) => console.log(err),
  });

  console.log("Logged in.");

  // Save session for future use
  const savedSession = client.session.save();
  fs.writeFileSync(SESSION_FILE, savedSession);
  console.log("Session saved.");

  // ===== Get dialog filters (folders) =====
  const filtersResult = await client.invoke(
    new Api.messages.GetDialogFilters(),
  );

  let keepChatIds = new Set();

  const filters = filtersResult.filters || [];
  console.log(`\nTotal folders found: ${filters.length}`);

  for (const f of filters) {
    console.log({ f });
    console.log(` - ${f.title?.text} (${f.includePeers?.length || 0} chats)`);
  }
  console.log(
    `\nSearching for folders containing "${TARGET_FOLDER_NAME}"...\n`,
  );

  for (const f of filters) {
    if (
      f.title?.text &&
      f.title?.text.toLowerCase().includes(TARGET_FOLDER_NAME.toLowerCase())
    ) {
      console.log(
        `✓ Found matching folder: "${f.title?.text}" with ${f.includePeers?.length || 0} chats`,
      );
      if (f.includePeers) {
        for (const peer of f.includePeers) {
          console.log({ peer });
          if (peer.channelId) keepChatIds.add(peer.channelId.value);
          if (peer.chatId) keepChatIds.add(peer.chatId.value);
          if (peer.userId) keepChatIds.add(peer.userId.value);
        }
      }
    }
  }

  console.log("\nTotal chats to keep:", keepChatIds.size);

  const dialogs = await client.getDialogs({});

  const chatsToRemove = [];

  for (const dialog of dialogs) {
    const entity = dialog.entity;
    const chatId = entity.id?.value || entity.id;

    if (keepChatIds.has(chatId)) {
      console.log(`✓ Keeping: ${dialog.name}`);
      continue;
    }

    chatsToRemove.push({
      name: dialog.name,
      dialog: dialog,
      entity: entity,
      isPrivate: !dialog.isChannel && !dialog.isGroup,
      isChannel: dialog.isChannel,
      isGroup: dialog.isGroup,
    });
  }

  console.log(`\n${"=".repeat(60)}`);
  console.log(`CHATS TO BE REMOVED (${chatsToRemove.length} total):`);
  console.log("=".repeat(60));

  for (const chat of chatsToRemove) {
    const type = chat.isPrivate
      ? "Private"
      : chat.isChannel
        ? "Channel"
        : "Group";
    console.log(`  [${type}] ${chat.name}`);
  }

  console.log("=".repeat(60));

  // Separate channels/groups and private chats
  const channelsGroupsToLeave = chatsToRemove.filter(
    (chat) => chat.isChannel || chat.isGroup,
  );
  const privateChatsToDelete = chatsToRemove.filter((chat) => chat.isPrivate);

  // Confirmation for leaving channels/groups
  if (channelsGroupsToLeave.length > 0) {
    console.log(
      `\nYou are about to leave ${channelsGroupsToLeave.length} channels/groups.`,
    );
    const confirmLeave = await input.text(
      "Type 'yes' to confirm leaving these channels/groups: ",
    );
    if (confirmLeave.toLowerCase() !== "yes") {
      console.log("Leaving channels/groups cancelled.");
    } else {
      console.log("\nStarting to leave channels/groups...\n");
      for (const chat of channelsGroupsToLeave) {
        try {
          await client.invoke(
            new Api.channels.LeaveChannel({ channel: chat.entity }),
          );
          console.log(`✗ Left channel/group: ${chat.name}`);
          // Sleep to avoid rate limiting (1 second between each operation)
          await sleep(1000);
        } catch (err) {
          console.log(`✗ Failed on ${chat.name}:`, err.message);
          // Sleep even on error to avoid hammering the API
          await sleep(1000);
        }
      }
      console.log("Finished leaving channels/groups.");
    }
  }

  // Confirmation for deleting private chats
  if (privateChatsToDelete.length > 0) {
    console.log(
      `\nYou are about to delete ${privateChatsToDelete.length} private chats.`,
    );
    const confirmDelete = await input.text(
      "Type 'yes' to confirm deleting these private chats: ",
    );
    if (confirmDelete.toLowerCase() !== "yes") {
      console.log("Deleting private chats cancelled.");
    } else {
      console.log("\nStarting to delete private chats...\n");
      for (const chat of privateChatsToDelete) {
        try {
          // For private chats, delete the dialog
          await client.invoke(
            new Api.messages.DeleteHistory({
              peer: chat.entity,
              maxId: 0,
              justClear: false,
              revoke: false,
            }),
          );
          console.log(`✗ Deleted private chat: ${chat.name}`);
          // Sleep to avoid rate limiting (1 second between each operation)
          await sleep(1000);
        } catch (err) {
          console.log(`✗ Failed on ${chat.name}:`, err.message);
          // Sleep even on error to avoid hammering the API
          await sleep(1000);
        }
      }
      console.log("Finished deleting private chats.");
    }
  }

  console.log("Done.");
})();
