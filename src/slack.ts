import { App, type SlashCommand } from "@slack/bolt"



export const app = new App({
    token: process.env.SLACK_BOT_TOKEN,
    socketMode: true,
    appToken: process.env.SLACK_APP_TOKEN,
})

function secretTalk(command: SlashCommand, mdtext: string) {
    console.log(command)
    let targetUser = command.user_id
    let targetChannel = command.channel_id
    app.client.chat.postEphemeral(
        {
            "channel": targetChannel,
            "user": targetUser,
            "markdown_text": mdtext
        }
    )
}

app.command(/^\/(tt|ttag)$/, async ({ command, ack, say }) => {
    await ack()
    let tag = command.text.trim()

    if (tag.length === 0) {
        secretTalk(command, "Please provide a tag.")
        return
    }

    secretTalk(command, `You said: ${tag}`)
})
