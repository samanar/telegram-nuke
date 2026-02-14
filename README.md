# Telegram Nuke

A Node.js script to bulk remove Telegram chats while preserving chats in specified folders.

## ⚠️ WARNING

This script will **permanently delete** private chats and **leave** channels/groups from your Telegram account. Make sure you have backups and understand what you're doing before running this script.

## Features

- Automatically keeps chats in folders containing "keep" in their name
- Removes all other chats (leaves channels/groups, deletes private chats)
- User confirmations before each removal operation
- Session persistence for faster subsequent runs
- Rate limiting to avoid API restrictions

## Prerequisites

- Node.js (v16 or higher)
- A Telegram account
- Telegram API credentials (API ID and API Hash)

## Getting Telegram API Credentials

1. Go to [https://my.telegram.org/auth](https://my.telegram.org/auth)
2. Log in with your phone number
3. Go to "API development tools"
4. Create a new application
5. Copy the `api_id` and `api_hash`

## Installation

1. Clone or download this repository
2. Install dependencies:
   ```bash
   npm install
   ```

## Configuration

1. Copy the example environment file:

   ```bash
   cp .env.example .env
   ```

2. Edit `.env` and fill in your credentials:
   ```
   API_ID=your_api_id_here
   API_HASH=your_api_hash_here
   PHONE_NUMBER=your_phone_number_here
   ```

## Usage

### Preparing Your Telegram Account

Before running the script, organize your chats into folders in Telegram:

1. Create a folder named something containing "keep" (e.g., "Important", "Keep These", "My Keep Folder")
2. Move all chats you want to preserve into this folder
3. The script will automatically detect folders with "keep" in their name

### Running the Script

```bash
node nuke.js
```

The script will:

1. Log you into Telegram (first run) or load existing session
2. Scan your folders for ones containing "keep"
3. List all chats that will be removed
4. Ask for confirmation before leaving channels/groups
5. Ask for confirmation before deleting private chats
6. Process the removals with 1-second delays to avoid rate limiting

## How It Works

1. **Authentication**: Uses your API credentials to authenticate with Telegram
2. **Folder Detection**: Finds all dialog filters (folders) and identifies those containing "keep"
3. **Chat Analysis**: Gets all your dialogs and determines which ones to keep based on folder membership
4. **Safe Removal**: Separates channels/groups (leaves them) from private chats (deletes history)
5. **Confirmation**: Requires explicit user confirmation for each type of removal

## Safety Features

- **Explicit Confirmations**: Must type "yes" to proceed with each removal type
- **Folder-Based Protection**: Only keeps chats in folders with "keep" in the name
- **Rate Limiting**: 1-second delays between operations
- **Session Saving**: Saves login session to avoid repeated 2FA

## Important Notes

- **Private Chats**: Deleting private chats removes the conversation history but doesn't block the contact
- **Channels/Groups**: Leaving removes you from the channel/group
- **Folders**: The script only checks folder names containing "keep" (case-insensitive)
- **Session**: The `session.txt` file contains your login session - keep it secure
- **API Limits**: Telegram has rate limits; the script includes delays to comply

## Troubleshooting

### Authentication Issues

- Make sure your API credentials are correct
- Check that your phone number is in international format (+country code)
- For accounts with 2FA, you'll be prompted for the password

### No Chats Found

- Ensure you have created folders in Telegram
- Check that at least one folder name contains "keep"
- Verify chats are actually moved into the keep folders

### Permission Errors

- Make sure the script can read/write `session.txt`
- Check file permissions for `.env`

## License

This project is provided as-is with no warranty. Use at your own risk.

## Disclaimer

This tool is for educational purposes. The author is not responsible for any data loss or account issues resulting from its use. Always backup important data before running destructive operations.
