import { App, type SlashCommand } from "@slack/bolt"
import { addTag, getTag } from "./tags"


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

function handleSendingTag(command: SlashCommand, tagName: string) {
    const tag = getTag(tagName) 

    if (!tag) {
        secretTalk(command, `Tag \`${tagName}\` not found.`)
        return
    }
    let message = `*Tag:*`

    if (!tag.formatting) {
        message += `\n \`\`\`
        ${tag.content}
        \`\`\`
        `
    }

    secretTalk(command, message)
}

app.command(/^\/(tt|ttag)$/, async ({ command, ack, say }) => {
    await ack()
    let tag = command.text.trim()

    if (tag.length === 0) {
        secretTalk(command, "Please provide a tag.")
        return
    }

    handleSendingTag(command, tag)
})

app.command("/t-create", async ({ command, ack, say }) => {
    await ack() // todo, improve, maybe dm?

    let commandContent = command.text.trim()

    const [tagName, ...tagContentParts] = commandContent.split(" ").filter(Boolean)

    if (!tagName || tagContentParts.length === 0) {
        secretTalk(command, "Usage: /t <tag> <content>")
        return
    }

    const tagContent = tagContentParts.join(" ")
    
    try {
        addTag(
        {
            tag: tagName,
            content: tagContent,
            created_at: new Date().toISOString(),
            creator: command.user_id,
            personal: false
        }
    )
    }
    catch (error) {
        console.error("Error adding tag:", error)
        secretTalk(command, "An error occurred while adding the tag.")
        return
    }

    secretTalk(command, `Tag \`${tagName}\` created successfully.`)
})
