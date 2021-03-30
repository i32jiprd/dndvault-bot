const cron = require('node-cron');
const path = require('path');
const { Client } = require('discord.js');
const { connect, disconnect } = require('mongoose');

const characters = require('./handlers/characters.js');
const events = require('./handlers/events.js');
const help = require('./handlers/help.js');
const users = require('./handlers/users.js');
const config = require('./handlers/config.js');
const utils = require('./utils/utils.js');
const poll = require('./handlers/poll.js');
const roll = require('./handlers/roll.js');

const DEFAULT_CONFIGDIR = __dirname;
const client = new Client({ partials: ['MESSAGE', 'CHANNEL', 'REACTION'] });

Client.prototype.dnd_users = users;

require('log-timestamp')(function () { return `[${new Date().toISOString()}] [shrd:${client.shard.ids}] %s` });

global.vaultVersion = require('./package.json').version;
global.Config = require(path.resolve(process.env.CONFIGDIR || DEFAULT_CONFIGDIR, './config.json'));
global.client = client;

/**
 * connect to the mongodb
 */
(async () => {
    console.info('connecting as mongo user: %s ...', Config.mongoUser);
    await connect('mongodb://' + Config.mongoUser + ':' + Config.mongoPass + '@' + Config.mongoServer + ':' + Config.mongoPort + '/' + Config.mongoSchema + '?authSource=' + Config.mongoSchema, {
        useNewUrlParser: true,
        useFindAndModify: false,
        useUnifiedTopology: true,
        useCreateIndex: true
    });
    console.info('Connected to mongo DB.  Logging into Discord now ...');
    return client.login(Config.token);
})();

/**
 * listen for emitted events from discordjs
 */
client.on('ready', () => {
    console.info(`D&D Vault Bot - logged in as ${client.user.tag}`);
    client.user.setPresence({ activity: { name: 'with Tiamat, type !help', type: 'PLAYING' }, status: 'online' });
});

client.on('messageReactionAdd', async (reaction, user) => {
    // When we receive a reaction we check if the reaction is partial or not
    try {
        if (reaction.partial) {
            // If the message this reaction belongs to was removed the fetching might result in an API error, which we need to handle
            await reaction.fetch();
        }
        if (reaction.message.partial) {
            await reaction.message.fetch();
        }
    } catch (error) {
        console.error('Something went wrong when fetching the message: ', error);
        // Return as `reaction.message.author` may be undefined/null
        return;
    }
    if (reaction.message.author.id === reaction.message.guild.me.id) {
        console.info(`messageReactionAdd:${reaction.message.guild.name}:${user.username}(bot?${user.bot}):${reaction.emoji.name}:${reaction.message.content}`);
        if (!user.bot) {
            try {
                // Now the message has been cached and is fully available
                await utils.checkChannelPermissions(reaction.message);
                let guildConfig = await config.confirmGuildConfig(reaction.message);
                if (reaction.message.embeds && reaction.message.embeds[0].author && reaction.message.embeds[0].author.name == 'Pollster') {
                    console.debug(`messageReactionAdd:POLL:${reaction.message.author}'s"${reaction.message.id}" gained a reaction!`);
                    await poll.handleReactionAdd(reaction, user, guildConfig);
                } else {
                    console.debug(`messageReactionAdd:EVENT:${reaction.message.author}'s "${reaction.message.id}" gained a reaction!`);
                    await events.handleReactionAdd(reaction, user, guildConfig);
                }
            } catch (error) {
                console.error(`messageReactionAdd:caught exception handling reaction`, error);
                await utils.sendDirectOrFallbackToChannelError(error, reaction.message, user);
            }
        }
    }
});

// client.on('messageReactionRemove', async (reaction, user) => {
//     console.log('messageReactionRemove');
//     // When we receive a reaction we check if the reaction is partial or not
//     try {
//         if (reaction.partial) {
//             // If the message this reaction belongs to was removed the fetching might result in an API error, which we need to handle
//             await reaction.fetch();
//         }
//         if (reaction.message.partial) {
//             await reaction.message.fetch();
//         }
//     } catch (error) {
//         console.error('Something went wrong when fetching the message: ', error);
//         // Return as `reaction.message.author` may be undefined/null
//         return;
//     }
//     if (!user.bot) {
//         // Now the message has been cached and is fully available
//         console.log(`${reaction.message.author}'s message "${reaction.message.id}" gained a reaction!`);
//         await events.handleReactionRemove(reaction, user);
//     } else {
//         console.log('bot reacted');
//     }
// });

client.on('message', async (msg) => {
    try {
        if (msg.partial) {
            // If the message this was removed the fetching might result in an API error, which we need to handle
            try {
                await msg.fetch();
            } catch (error) {
                console.error('Something went wrong when fetching the message: ', error);
                // Return as `reaction.message.author` may be undefined/null
                return;
            }
        }
        if (msg.author.bot) {
            // it's a message from a bot, ignore
            // if (!msg.guild) {
            //     console.info(`msg: DIRECT:${msg.author.tag}:${msg.content}:bot message, ignoring`);
            // } else {
            //     console.debug(`msg: ${msg.guild.name}:${msg.author.tag}(${msg.member?msg.member.displayName:'unknown'}):${msg.content}:bot message, ignoring`);
            // }
            return;
        }

        let messageContentLowercase = msg.content.toLowerCase();
        if (!msg.guild) {
            if (messageContentLowercase.startsWith('help')) {
                help.handleHelp(msg, null, Config.inviteURL);
            } else if (messageContentLowercase.startsWith('stats')) {
                config.handleStats(msg);
            } else {
                await utils.sendDirectOrFallbackToChannel({ name: 'Direct Interaction Error', value: 'Please send commands to me on the server that you wish me to act with.' }, msg);
            }
            console.log(`msg processed: DIRECT:${msg.author.tag}:${msg.content}`);
            return;
        }
        let guildConfig = await config.confirmGuildConfig(msg);
        if (!messageContentLowercase.startsWith(guildConfig.prefix)) return;
        // console.log(`msg: ${msg.guild.name}:${msg.author.tag}(${msg.member.displayName}):${msg.content}`);
        if (messageContentLowercase.startsWith(guildConfig.prefix + 'help')) {
            help.handleHelp(msg, guildConfig, Config.inviteURL);
            return;
        }
        await utils.checkChannelPermissions(msg);
        if (!await users.hasRoleOrIsAdmin(msg.member, guildConfig.prole)) {
            await msg.reply(`<@${msg.member.id}>, please have an admin add you to the proper player role to use this bot`);
            return;
        }
        let dontLog = false;
        if (messageContentLowercase.startsWith(guildConfig.prefix + 'register manual')) {
            characters.handleRegisterManual(msg, guildConfig);
        } else if (messageContentLowercase.startsWith(guildConfig.prefix + 'register')) {
            characters.handleRegister(msg, guildConfig);
        } else if (messageContentLowercase.startsWith(guildConfig.prefix + 'update manual')) {
            characters.handleUpdateManual(msg, guildConfig);
        } else if (messageContentLowercase.startsWith(guildConfig.prefix + 'update')) {
            characters.handleUpdate(msg, guildConfig);
        } else if (messageContentLowercase.startsWith(guildConfig.prefix + 'changes')) {
            characters.handleChanges(msg, guildConfig);
        } else if (messageContentLowercase.startsWith(guildConfig.prefix + 'campaign')) {
            characters.handleCampaign(msg, guildConfig);
        } else if (messageContentLowercase.startsWith(guildConfig.prefix + 'list campaign')) {
            characters.handleListCampaign(msg, guildConfig);
        } else if (messageContentLowercase.startsWith(guildConfig.prefix + 'list user')) {
            characters.handleListUser(msg, guildConfig);
        } else if (messageContentLowercase.startsWith(guildConfig.prefix + 'list all')) {
            characters.handleListAll(msg, guildConfig);
        } else if (messageContentLowercase.startsWith(guildConfig.prefix + 'list queued')) {
            characters.handleListQueued(msg, guildConfig);
        } else if (messageContentLowercase.startsWith(guildConfig.prefix + 'list')) {
            characters.handleList(msg, guildConfig);
        } else if (messageContentLowercase.startsWith(guildConfig.prefix + 'remove')) {
            characters.handleRemove(msg, guildConfig);
        } else if (messageContentLowercase.startsWith(guildConfig.prefix + 'approve')) {
            characters.handleApprove(msg, guildConfig);
        } else if (messageContentLowercase.startsWith(guildConfig.prefix + 'show')) {
            characters.handleShow(msg, guildConfig);
        } else if (messageContentLowercase.startsWith(guildConfig.prefix + 'event create')) {
            events.handleEventCreate(msg, guildConfig);
        } else if (messageContentLowercase.startsWith(guildConfig.prefix + 'event edit')) {
            events.handleEventEdit(msg, guildConfig);
        } else if (messageContentLowercase.startsWith(guildConfig.prefix + 'event remove')) {
            events.handleEventRemove(msg, guildConfig);
        } else if (messageContentLowercase.startsWith(guildConfig.prefix + 'event show')) {
            events.handleEventShow(msg, guildConfig);
        } else if (messageContentLowercase.startsWith(guildConfig.prefix + 'event list proposed')) {
            events.handleEventListProposed(msg, guildConfig);
        } else if (messageContentLowercase.startsWith(guildConfig.prefix + 'event list deployed')) {
            events.handleEventListDeployed(msg, guildConfig);
        } else if (messageContentLowercase.startsWith(guildConfig.prefix + 'event list')) {
            events.handleEventList(msg, guildConfig);
        } else if (messageContentLowercase.startsWith(guildConfig.prefix + 'poll')) {
            poll.handlePoll(msg, guildConfig);
        } else if (messageContentLowercase.startsWith(guildConfig.prefix + 'default')) {
            users.handleDefault(msg, guildConfig);
        } else if (messageContentLowercase.startsWith(guildConfig.prefix + 'timezone')) {
            users.handleTimezone(msg, guildConfig);
        } else if (messageContentLowercase.startsWith(guildConfig.prefix + 'stats')) {
            config.handleStats(msg);
        } else if (messageContentLowercase.startsWith(guildConfig.prefix + 'config approval')) {
            config.handleConfigApproval(msg, guildConfig);
        } else if (messageContentLowercase.startsWith(guildConfig.prefix + 'config eventchannel')) {
            config.handleConfigEventChannel(msg, guildConfig);
        } else if (messageContentLowercase.startsWith(guildConfig.prefix + 'config pollchannel')) {
            config.handleConfigPollChannel(msg, guildConfig);
        } else if (messageContentLowercase.startsWith(guildConfig.prefix + 'config prefix')) {
            config.handleConfigPrefix(msg, guildConfig);
        } else if (messageContentLowercase.startsWith(guildConfig.prefix + 'config arole')) {
            config.handleConfigArole(msg, guildConfig);
        } else if (messageContentLowercase.startsWith(guildConfig.prefix + 'config prole')) {
            config.handleConfigProle(msg, guildConfig);
        } else if (messageContentLowercase.startsWith(guildConfig.prefix + 'config campaign')) {
            config.handleConfigCampaign(msg, guildConfig);
        } else if (messageContentLowercase.startsWith(guildConfig.prefix + 'config')) {
            config.handleConfig(msg, guildConfig);
        } else if (messageContentLowercase.startsWith(guildConfig.prefix + 'roll')) {
            roll.handleDiceRoll(msg, guildConfig);
        } else {
            dontLog = true;
        }
        if (!dontLog) {
            console.log(`msg processed: ${msg.guild.name}:${msg.author.tag}(${msg.member.displayName}):${msg.content}`);
        }
    } catch (error) {
        console.error('on_message: ', error);
        await utils.sendDirectOrFallbackToChannelError(error, msg);
    }
});

// client.on('raw', packet => {
//     // We don't want this to run on unrelated packets
//     if (!['MESSAGE_REACTION_ADD', 'MESSAGE_REACTION_REMOVE'].includes(packet.t)) return;
//     console.log('received raw event for reaction');
//     // Grab the channel to check the message from
//     const channel = client.channels.get(packet.d.channel_id);
//     // There's no need to emit if the message is cached, because the event will fire anyway for that
//     if (channel.messages.has(packet.d.message_id)) return;
//     // Since we have confirmed the message is not cached, let's fetch it
//     console.log('fetching message for reaction');
//     channel.fetchMessage(packet.d.message_id).then(message => {
//         // Emojis can have identifiers of name:id format, so we have to account for that case as well
//         const emoji = packet.d.emoji.id ? `${packet.d.emoji.name}:${packet.d.emoji.id}` : packet.d.emoji.name;
//         // This gives us the reaction we need to emit the event properly, in top of the message object
//         const reaction = message.reactions.get(emoji);
//         // Adds the currently reacting user to the reaction's users collection.
//         if (reaction) reaction.users.set(packet.d.user_id, client.users.get(packet.d.user_id));
//         // Check which type of event it is before emitting
//         if (packet.t === 'MESSAGE_REACTION_ADD') {
//             client.emit('messageReactionAdd', reaction, client.users.get(packet.d.user_id));
//         }
//         if (packet.t === 'MESSAGE_REACTION_REMOVE') {
//             client.emit('messageReactionRemove', reaction, client.users.get(packet.d.user_id));
//         }
//     });
// });

process.on('SIGTERM', async () => {
    console.info('SIGTERM signal received.');
    await cleanShutdown(true);
});

process.on('SIGINT', async () => {
    console.info('SIGINT signal received.');
    await cleanShutdown(true);
});

process.on('SIGUSR1', async () => {
    console.info('SIGUSR1 signal received.');
    await cleanShutdown(true);
});

process.on('SIGUSR2', async () => {
    console.info('SIGUSR2 signal received.');
    await cleanShutdown(true);
});

process.on('uncaughtException', async (error) => {
    console.info('uncaughtException signal received.', error);
    await cleanShutdown(true);
});

/**
 * scheduled cron for calendar reminders
 */
const calendarReminderCron = cron.schedule(Config.calendarReminderCron, () => {
    events.sendReminders(client);
});

/**
 *
 * @param {boolean} callProcessExit
 */
async function cleanShutdown(callProcessExit) {
    try {
        console.log('Closing out shard resources...');
        calendarReminderCron.destroy();
        console.log('Scheduled calendar reminders destroyed.');
        client.destroy();
        console.log('Discord client destroyed.');
        // boolean means [force], see in mongoose doc
        await disconnect();
        console.log('MongoDb connection closed.');
    } catch (error) {
        console.error("could not cleanly shutdown shard", error);
    }
    if (callProcessExit) {
        console.log('Exiting.');
        process.exit(0);
    }
}
