import { App, type SlashCommand } from "@slack/bolt"
import { addTag, getTag } from "./tags"

const CREATE_TAG_CALLBACK_ID = "create_tag_modal"
const TAG_NAME_BLOCK_ID = "tag_name"
const TAG_CONTENT_BLOCK_ID = "tag_content"
const FORMATTING_BLOCK_ID = "formatting"
const PERSONAL_BLOCK_ID = "personal"
const TAG_NAME_ACTION_ID = "tag_name_input"
const TAG_CONTENT_ACTION_ID = "tag_content_input"
const FORMATTING_ACTION_ID = "formatting_select"
const PERSONAL_ACTION_ID = "personal_checkbox"

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
    const language = tag.formatting ?? ""
    const message = `*Tag:*\n\`\`\`${language}\n${tag.content}\n\`\`\``

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
    await ack()

    let commandContent = command.text.trim()

    const [tagName = "", ...tagContentParts] = commandContent.split(" ").filter(Boolean)
    const tagContent = tagContentParts.join(" ")

    await app.client.views.open({
        trigger_id: command.trigger_id,
        view: {
            type: "modal",
            callback_id: CREATE_TAG_CALLBACK_ID,
            private_metadata: command.channel_id,
            title: {
                type: "plain_text",
                text: "Create a new tag",
                emoji: true
            },
            submit: {
                type: "plain_text",
                text: "Submit",
                emoji: true
            },
            close: {
                type: "plain_text",
                text: "Cancel",
                emoji: true
            },
            blocks: [
                {
                    type: "input",
                    block_id: TAG_NAME_BLOCK_ID,
                    element: {
                        type: "plain_text_input",
                        action_id: TAG_NAME_ACTION_ID,
                        initial_value: tagName
                    },
                    label: {
                        type: "plain_text",
                        text: "Tag name (this is what you are going to call it by)",
                        emoji: true
                    },
                    optional: false
                },
                {
                    type: "input",
                    block_id: TAG_CONTENT_BLOCK_ID,
                    element: {
                        type: "plain_text_input",
                        multiline: true,
                        action_id: TAG_CONTENT_ACTION_ID,
                        initial_value: tagContent
                    },
                    label: {
                        type: "plain_text",
                        text: "Tag Content",
                        emoji: true
                    },
                    optional: false
                },
                {
                    type: "input",
                    block_id: FORMATTING_BLOCK_ID,
                    element: {
                        type: "plain_text_input",
                        placeholder: {
                            type: "plain_text",
                            text: "python, bash, js, etc.",
                            emoji: true
                        },
                        action_id: FORMATTING_ACTION_ID
                    },
                    label: {
                        type: "plain_text",
                        text: "Code fence language",
                        emoji: true
                    },
                    optional: true
                },
                {
                    type: "input",
                    block_id: PERSONAL_BLOCK_ID,
                    element: {
                        type: "checkboxes",
                        options: [
                            {
                                text: {
                                    type: "plain_text",
                                    text: "Personal tag",
                                    emoji: true
                                },
                                value: "personal"
                            }
                        ],
                        action_id: PERSONAL_ACTION_ID
                    },
                    label: {
                        type: "plain_text",
                        text: "Extras",
                        emoji: true
                    },
                    optional: true
                }
            ]
        }
    })
})

app.view(CREATE_TAG_CALLBACK_ID, async ({ ack, body, view }) => {
    const values = view.state.values
    const tagName = values[TAG_NAME_BLOCK_ID]?.[TAG_NAME_ACTION_ID]?.value?.trim()
    const tagContent = values[TAG_CONTENT_BLOCK_ID]?.[TAG_CONTENT_ACTION_ID]?.value?.trim()
    const formatting = values[FORMATTING_BLOCK_ID]?.[FORMATTING_ACTION_ID]?.value?.trim()
    const personalOptions = values[PERSONAL_BLOCK_ID]?.[PERSONAL_ACTION_ID]?.selected_options ?? []

    if (!tagName) {
        await ack({
            response_action: "errors",
            errors: {
                [TAG_NAME_BLOCK_ID]: "Please provide a tag name."
            }
        })
        return
    }

    if (!tagContent) {
        await ack({
            response_action: "errors",
            errors: {
                [TAG_CONTENT_BLOCK_ID]: "Please provide tag content."
            }
        })
        return
    }

    await ack()

    try {
        addTag(
        {
            tag: tagName,
            content: tagContent,
            created_at: new Date().toISOString(),
            creator: body.user.id,
            personal: personalOptions.some((option) => option.value === "personal"),
            formatting: formatting || undefined
        }
    )
    }
    catch (error) {
        console.error("Error adding tag:", error)
        await app.client.chat.postEphemeral({
            channel: view.private_metadata,
            user: body.user.id,
            markdown_text: "An error occurred while adding the tag."
        })
        return
    }

    await app.client.chat.postEphemeral({
        channel: view.private_metadata,
        user: body.user.id,
        markdown_text: `Tag \`${tagName}\` created successfully.`
    })
})
