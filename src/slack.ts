import { App } from '@slack/bolt';

/**
 * This sample Slack application uses Socket Mode.
 * For the companion getting started setup guide, see:
 * https://docs.slack.dev/tools/bolt-js/getting-started/
 */

// Initializes your app with your bot token and app token
export const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  socketMode: true,
  appToken: process.env.SLACK_APP_TOKEN
});

// Listens to incoming messages that contain "hello"
app.message('hello', async ({ message, say }) => {
  // say() sends a message to the channel where the event was triggered
  await say({
    text: `Hey there!`
  });
});
