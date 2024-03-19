import Eris from "eris";
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const slashCommands = require("./commands.json");
import { Database } from "st.db"
const counts_db = new Database("./data/count")
const user_tickets_db = new Database("./data/users_tickets")
const tickets_db = new Database("./data/tickets")

const bot = new Eris(process.env["token"], {
    intents: 32509,
    allowedMentions: {
        everyone: true,
        roles: true
    }
})

bot.on("error", console.log)
bot.on("ready", async () => {
    console.log("\u001b[32m▶▷ \u001b[0m\u001b[0m\u001b[40;1m\u001b[34;1mBot Ready!\u001b[0m \u001b[32m◁◀ \u001b[0m");
    await bot.editStatus("Online", { type: 0, name:  process.env["status"] || "" })
    await bot.bulkEditCommands(slashCommands)
})

bot.on("interactionCreate", async (interaction) => {
    if (interaction.type == 5) {
        if (interaction.data.custom_id.startsWith("ct")) {
            if (!await user_tickets_db.has(`${interaction.data.custom_id.split("_")[1]}`)) return await interaction.createMessage({
                flags: 64,
                content: ":x:There is no data about these buttons!"
            })
            if (interaction.channel.name.startsWith("closed")) return await interaction.createMessage({
                flags: 64,
                content: ":x: This ticket is already closed."
            })
            let cd_data = await user_tickets_db.get(`${interaction.data.custom_id.split("_")[1]}`);
            let old_custom_id = interaction.data.custom_id
            interaction.data.custom_id = cd_data
            await interaction.createMessage({
                embeds: [{
                    description: `☑️ The ticket is locked by <@!${interaction.member.id}>`,
                    fields: [{ name: "The reason", value: `\`\`\`${interaction.data.components[0].components[0].value}\`\`\`` }],
                    color: 0xdfb21f
                }]
            }).catch(() => { });
            let ticket_by = cd_data.split("_")[1]
            await bot.editChannelPermission(interaction.channel.id, ticket_by, 0n, 3072n, 1).catch(console.error)
            await bot.editChannel(interaction.channel.id, { name: `closed-${interaction.channel.name.split("-")[1]}` }).catch(console.error)
            await bot.createMessage(interaction.channel.id, {
                embeds: [
                    {
                        description: `\`\`\`Support team controls\`\`\``,
                        color: 0x2B2E30
                    }
                ],
                components: [{
                    type: 1, components: [{
                        type: 2,
                        emoji: { name: "📑" },
                        style: 2,
                        custom_id: `tt_${old_custom_id.split("_").slice(1).join("_")}_${Date.now()}`
                    }, {
                        type: 2,
                        emoji: { name: "🔓" },
                        style: 2,
                        custom_id: `ot_${old_custom_id.split("_").slice(1).join("_")}_${Date.now()}`
                    }, {
                        type: 2,
                        emoji: { name: "🗑️" },
                        style: 2,
                        custom_id: `dt_${old_custom_id.split("_").slice(1).join("_")}_${Date.now()}`
                    }]
                }]
            }).catch(console.error)
            let msgs = await bot.getMessages(interaction.channel.id, { limit: 500 })
            setTimeout(async () => {
                await bot.createMessage(interaction.data.custom_id.split("_")[4], {
                    embeds: [{
                        title: "Ticket has been locked",
                        description: `The ticket is locked by <@!${interaction.member.id}>`,
                        fields: [{ name: "The ticket", value: `<#${interaction.data.custom_id.split("_")[2]}>` }, { name: "The reason", value: `\`\`\`${interaction.data.components[0].components[0].value}\`\`\`` }, { name: "Ticket type", value: `\`\`\`${interaction.data.custom_id.split("_")[3].replaceAll("-", " ")}\`\`\`` }, { name: "Ticket by", value: `<@!${interaction.data.custom_id.split("_")[1]}>` }],
                        color: 0xdfb21f,
                        timestamp: new Date()
                    }]
                }, {
                    file: msgs.reverse().filter(x => x.content).map(x => `${x.author.username}: ${x.content}`).join("\n"),
                    name: "transcript.txt"
                }).catch(console.error)
            }, 2000)
        }
    }
    if (interaction.type == 3) {
        if (interaction.data.custom_id.startsWith("ct_")) {
            if (!await user_tickets_db.has(`${interaction.data.custom_id.split("_")[1]}`)) return await interaction.createMessage({
                flags: 64,
                content: ":x: There is no data about these buttons!"
            })
            if (interaction.channel.name.startsWith("closed")) return await interaction.createMessage({
                flags: 64,
                content: ":x: This ticket is already closed"
            })
            let cd_data = await user_tickets_db.get(`${interaction.data.custom_id.split("_")[1]}`);
            let old_custom_id = interaction.data.custom_id
            interaction.data.custom_id = cd_data
            if (interaction.data.custom_id.split("_")[1] != interaction.member.id && !interaction.member.roles.some(x => x == interaction.data.custom_id.split("_")[5])) return await interaction.createMessage({
                flags: 64,
                content: "Only the ticket owner or support can lock this ticket.:x:"
            })
            await bot.createInteractionResponse(interaction.id, interaction.token, {
                type: 9, data: {
                    "title": "Why the ticket was locked",
                    "custom_id": old_custom_id + "_" + Date.now(),
                    "components": [
                        {
                            "type": 1,
                            "components": [
                                {
                                    "type": 4,
                                    "label": "Reason for locking ticket",
                                    "style": 2,
                                    "custom_id": "reason",
                                    "placeholder": "Write a reason or reasons for closing your ticket",
                                    "required": true,
                                    "min_length": 5,
                                    "max_length": 250
                                }
                            ]
                        }
                    ]
                }
            })
        }
        if (interaction.data.custom_id.startsWith("tt_")) {
            if (!await user_tickets_db.has(`${interaction.data.custom_id.split("_")[1]}`)) return await interaction.createMessage({
                flags: 64,
                content: ":x: No data about these buttons"
            })

            let cd_data = await user_tickets_db.get(`${interaction.data.custom_id.split("_")[1]}`);

            let old_custom_id = interaction.data.custom_id
            interaction.data.custom_id = cd_data
            if (!interaction.member.roles.some(x => x == interaction.data.custom_id.split("_")[5])) return await interaction.createMessage({
                flags: 64,
                content: "Only support can perform this procedure :x:" + `\n<@&${interaction.data.custom_id.split("_")[5]}>`
            })
            await interaction.defer()
            let msgs = await bot.getMessages(interaction.channel.id, { limit: 500 })
            await interaction.createFollowup({
                embeds: [{
                    title: "The ticket has been transffered",
                    description: `The ticket was fowarded by <@!${interaction.member.id}>`,
                    color: 0xdfb21f,
                    timestamp: new Date()
                }]
            }, {
                file: msgs.reverse().filter(x => x.content).map(x => `${x.author.username}: ${x.content}`).join("\n"),
                name: "transcript.txt"
            })
        }
        if (interaction.data.custom_id.startsWith("dt_")) {
            if (!await user_tickets_db.has(`${interaction.data.custom_id.split("_")[1]}`)) return await interaction.createMessage({
                flags: 64,
                content: ":x: No data"
            })
            let cd_data = await user_tickets_db.get(`${interaction.data.custom_id.split("_")[1]}`);
            let old_custom_id = interaction.data.custom_id
            interaction.data.custom_id = cd_data
            if (!interaction.member.roles.some(x => x == interaction.data.custom_id.split("_")[5])) return await interaction.createMessage({
                flags: 64,
                content: "Only staff can use this :x:" + `\n<@&${interaction.data.custom_id.split("_")[5]}>`
            })
            await interaction.createMessage({ flags: 64, content: "جاري تنفيذ طلبك" })
            let msgs = await bot.getMessages(interaction.channel.id, { limit: 500 })
            setTimeout(async () => {
                await bot.deleteChannel(interaction.data.custom_id.split("_")[2])
                await bot.createMessage(interaction.data.custom_id.split("_")[4], {
                    embeds: [{
                        title: "Ticket has been deleted",
                        description: `Ticket deleted by <@!${interaction.member.id}>`,
                        fields: [{ name: "The ticket", value: `${interaction.data.custom_id.split("_")[2]}` }, { name: "Ticket Type", value: `\`\`\`${interaction.data.custom_id.split("_")[3].replaceAll("-", " ")}\`\`\`` }, { name: "Ticket by", value: `<@!${interaction.data.custom_id.split("_")[1]}>` }],
                        color: 0xdf1f1f,
                        timestamp: new Date()
                    }]
                }, {
                    file: msgs.reverse().filter(x => x.content).map(x => `${x.author.username}: ${x.content}`).join("\n"),
                    name: "transcript.txt"
                })
            }, 4000)
        }
        if (interaction.data.custom_id.startsWith("ot")) {
            if (!await user_tickets_db.has(`${interaction.data.custom_id.split("_")[1]}`)) return await interaction.createMessage({
                flags: 64,
                content: ":x: No data"
            })
            let cd_data = await user_tickets_db.get(`${interaction.data.custom_id.split("_")[1]}`);
            let old_custom_id = interaction.data.custom_id
            interaction.data.custom_id = cd_data
            console.log(interaction.data.custom_id.split("_")[5])
            if (!interaction.member.roles.some(x => x == interaction.data.custom_id.split("_")[5])) return await interaction.createMessage({
                flags: 64,
                content: "Only staff can use this :x:" + `\n<@&${interaction.data.custom_id.split("_")[5]}>`
            })
            await bot.deleteMessage(interaction.channel.id, interaction.message.id)
            await bot.createMessage(interaction.channel.id, {
                embeds: [{
                    description: `☑️ Ticket opened by <@!${interaction.member.id}>`,
                    color: 0x3FB745
                }]
            }).catch(() => { });
            let ticket_by = cd_data.split("_")[1]
            await bot.editChannelPermission(interaction.channel.id, ticket_by, 3072n, 0n, 1)
            await bot.editChannel(interaction.channel.id, { name: `ticket-${interaction.channel.name.split("-")[1]}` })
            await bot.createMessage(interaction.data.custom_id.split("_")[4], {
                embeds: [{
                    title: "Ticket has been opened",
                    description: `Ticket opened by <@!${interaction.member.id}>`,
                    fields: [{ name: "The ticket", value: `<#${interaction.data.custom_id.split("_")[2]}>` }, { name: "Ticket type", value: `\`\`\`${interaction.data.custom_id.split("_")[3].replaceAll("-", " ")}\`\`\`` }, { name: "Ticket by", value: `<@!${interaction.data.custom_id.split("_")[1]}>` }],
                    color: 0x3FB745,
                    timestamp: new Date()
                }]
            })
        }
        if (interaction.data.custom_id.startsWith("ticket")) {
            let ticket_id = interaction.data.custom_id.split("_")[1]
            let ticket_type_index = interaction.data.custom_id.split("_")[2]
            if (!await tickets_db.has(`${ticket_id}`)) return await interaction.createMessage({
                flags: 64,
                content: "فئة التذاكر هذه لم تعد تعمل"
            })
            let ticket_data = await tickets_db.get(`${ticket_id}`)
            interaction.data.custom_id = ticket_data[`custom_id_${ticket_type_index}`]
            await interaction.createMessage({
                flags: 64,
                content: "Waiting..."
            })

            let count = await counts_db.has(`${interaction.data.custom_id.split("_")[1]}_${interaction.data.custom_id.split("_")[3]}`) ? await counts_db.get(`${interaction.data.custom_id.split("_")[1]}_${interaction.data.custom_id.split("_")[3]}`) : 0
            bot.createChannel(interaction.guildID, `ticket-${padNum(count + 1, 4)}`, 0, {
                parentID: interaction.data.custom_id.split("_")[3], topic: `Ticket ${interaction.data.custom_id.split("_")[1].replaceAll("-", " ")}\nBy <@!${interaction.member.id}>`,
                permissionOverwrites: [
                    {
                        id: interaction.guildID,
                        allow: 0n,
                        deny: 3072n,
                        type: 0
                    },
                    {
                        id: interaction.data.custom_id.split("_")[2],
                        allow: 3072n,
                        deny: 0n,
                        type: 0
                    },
                    {
                        id: interaction.member.id,
                        allow: 3072n,
                        deny: 0n,
                        type: 1
                    },
                    {
                        id: bot.user.id,
                        allow: 3072n,
                        deny: 0n,
                        type: 1
                    }
                ]
            }).then(async channel => {
                await interaction.editOriginalMessage({
                    flags: 64,
                    content: `☑️ Ticket has been created <#${channel.id}>`,
                })
                await bot.createMessage(interaction.data.custom_id.split("_")[4], {
                    embeds: [{
                        title: "Ticket created",
                        description: `Ticket created by <@!${interaction.member.id}>`,
                        fields: [{ name: "The ticket", value: `<#${channel.id}>` }, { name: "Ticket type", value: `\`\`\`${interaction.data.custom_id.split("_")[1].replaceAll("-", " ")}\`\`\`` }, { name: "The reason", value: `\`\`\`${interaction.data.custom_id.split("_")[5].replaceAll("-", " ")}\`\`\`` }],
                        color: 0x3FB745,
                        timestamp: new Date()
                    }]
                })
                await counts_db.add(`${interaction.data.custom_id.split("_")[1]}_${interaction.data.custom_id.split("_")[3]}`, 1)
                let id = Date.now().toString()
                await user_tickets_db.set(`${id}`, `ct_${interaction.member.id}_${channel.id}_${interaction.data.custom_id.split("_")[1]}_${interaction.data.custom_id.split("_")[4]}_${interaction.data.custom_id.split("_")[2]}`)
                await channel.createMessage({
                    content: `Welcome, <@!${interaction.member.id}>, <@&${interaction.data.custom_id.split("_")[2]}>`, embeds: [
                        {
                            title: `${interaction.data.custom_id.split("_")[1].replaceAll("-", " ")}`,
                            description: `Thank you for contacting support.
Please don't @ admins we get @ted at the start of the ticket🔒${interaction.data.custom_id.split("_")[5] == true ? "" : `\n\`\`\`${interaction.data.custom_id.split("_")[5].replaceAll("-", " ")}\`\`\` `}`,
                            color: 0x3FB745,
                            footer: { text: "" }
                        }
                    ],
                    components: [{
                        type: 1, components: [{
                            type: 2,
                            emoji: { name: "🔒" },
                            style: 2,
                            custom_id: `ct_${id}`
                        }]
                    }]
                })
            })
        }
    }
    if (interaction.type == 2) {
        if (interaction.data.name == "setup") {
            if (!interaction.member.permissions.has("administrator")) return await interaction.createMessage({
                flags: 64,
                content: ":x: You dont have permission"
            })
            let options = interaction.data.options;
            let title = options.find(e => e.name == "name").value;
            let description = options.find(e => e.name == "description").value.replaceAll("<br>","\n").replaceAll("</br>","\n");
            let category = options.find(e => e.name == "category").value;
            let logs_channel = options.find(e => e.name == "logs_channel").value;
            let style_color = [{ "hex": 0x5865F2, "style": "1" }, { "hex": 0x43B581, "style": "3" }, { "hex": 0x4F545C, "style": "2" }, { "hex": 0xF04747, "style": "4" }][options.find(e => e.name == "color").value]
            let id = Date.now().toString()
            let data = { id, logs_channel, style_color, category, description, title };
            await interaction.createMessage({
                flags: 64,
                embeds: [{
                    title: "☑️ Success",
                    color: 0x3FB745
                }]
            });
            let components = [];
            for (let i = 1; i <= 5; i++) {
                if (options.some(e => e.name == `button_name_${i}`) && options.some(e => e.name == `support_role_${i}`)) {
                    data[`button_name_${i}`] = options.find(e => e.name == `button_name_${i}`).value
                    data[`support_role_${i}`] = options.find(e => e.name == `support_role_${i}`).value
                    data[`custom_id_${i}`] = `ticket_${title.replaceAll(" ", "-")}_${data[`support_role_${i}`]}_${category}_${logs_channel}_${data[`button_name_${i}`]}_${i}`
                    components.push({
                        type: 2,
                        style: style_color.style,
                        label: data[`button_name_${i}`],
                        custom_id: `ticket_${id}_${i}`
                    })
                }
            };

            let embeds = [{
                title, description,
                color: style_color.hex,
                thumbnail: {
                    url: options.some(e => e.name == "thumbnail") ? interaction.data.resolved.attachments[options.find(e => e.name == "thumbnail").value].url : null,
                }, image: {
                    url: options.some(e => e.name == "image") ? interaction.data.resolved.attachments[options.find(e => e.name == "image").value].url : null,
                }
            }]
            await interaction.channel.createMessage({ embeds, components: [{ type: 1, components }] })
            await tickets_db.set(`${id}`, data)
        }
    }
})

function padNum(num, length) {
    return Array((length + 1) - num.toString().length).join("0") + num;
}

process.on('unhandledRejection', (reason, p) => {
    console.log('Unhandled Rejection/Catch\u001b[0m');
    console.log(reason, p);
}).on("uncaughtException", (err, origin) => {
    console.log('Uncaught Exception/Catch\u001b[0m');
    console.log(err, origin);
}).on('uncaughtExceptionMonitor', (err, origin) => {
    console.log('Uncaught Exception/Catch (MONITOR)\u001b[0m');
    console.log(err, origin);
});

bot.connect();