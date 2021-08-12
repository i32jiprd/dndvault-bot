process.env.TZ = 'GMT';
require('log-timestamp')(function () { return `[${new Date().toISOString()}] [mngr] %s` });
const { ShardingManager } = require('discord.js');
const { AutoPoster } = require('topgg-autoposter');
const path = require('path');
const fetch = require('node-fetch');
const url = require('url');
const { connect, disconnect, STATES, connection } = require('mongoose');
const NodeCache = require("node-cache");

const GuildModel = require('./models/Guild');
const EventModel = require('./models/Event');
const UserModel = require('./models/User');

const DEFAULT_CONFIGDIR = __dirname;
global.Config = require(path.resolve(process.env.CONFIGDIR || DEFAULT_CONFIGDIR, './config.json'));
global.GuildCache = new NodeCache({ stdTTL: 86400, checkperiod: 14400 });

const timezones = require('./handlers/timezones.js');
const calendar = require('./handlers/calendar.js');

const express = require('express');
const session = require('express-session');
const morgan = require('morgan');
const Grant = require('grant').express();
const grant = new Grant(Config);

// am I in the process of shutting down?
let shutdown = false;

/**
 * connect to the mongodb
 */
(async () => {
    console.log('mongo user: %s ... connecting', Config.mongoUser);
    await connect('mongodb://' + Config.mongoUser + ':' + Config.mongoPass + '@' + Config.mongoServer + ':' + Config.mongoPort + '/' + Config.mongoSchema + '?authSource=' + Config.mongoSchema, {
        useNewUrlParser: true,
        useFindAndModify: false,
        useUnifiedTopology: true,
        useCreateIndex: true
    });
    console.log('Manager connected to mongo.');
})();

/**
 * invoke shardingmanager
 */
const manager = new ShardingManager('./bot.js', { token: Config.token, respawn: false, totalShards: Config.totalShards });

manager.on('shardCreate', (shard) => {
    console.log(`===== Launched shard ${shard.id} =====`);
    shard.on('death', (process) => {
        console.log(`===== Shard ${shard.id} died with exitcode ${process.exitCode}; shutdown status is ${shutdown} =====`);
        if (!shutdown) {
            console.error(`Shard ${shard.id} should not have shutdown, something is awry, shutting down server completely.`);
            cleanShutdown(true);
        }
    });
});

if (!Config.debugGuild && Config.topggToken) {
    // TOP.GG stats poster
    const poster = AutoPoster(Config.topggToken, manager);
    poster.on('posted', () => {
        console.log('TOP.GG: Posted stats');
    });
}

manager.spawn();

const ROUTE_ROOT = '/';
const ROUTE_POSTOAUTH = '/postoauth';
const ROUTE_CALENDAR = '/calendar';
const ROUTE_TIMEZONES = '/timezones';
const ROUTE_TIMEZONESSET = '/timezones/set';
const ROUTE_EVENTS = '/events';
const ROUTE_EVENTSSET = '/events/set';
const ROUTE_HEALTH = '/health';
const ROUTE_LOGOUT = '/logout';

let app = express();

app.locals.pretty = true;
let server = app
    .set('trust proxy', true)
    .use(morgan('[:date[iso]] [mngr: HTTP] :remote-addr - :remote-user ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent"'))
    .set('views', Config.httpPugDir)
    .set('view engine', 'pug')
    .use(session({ secret: 'grant', saveUninitialized: true, resave: false, maxAge: Date.now() + (7 * 86400 * 1000) }))
    .use(grant)
    .use(ROUTE_ROOT, express.static(Config.httpStaticDir))
    .use(express.json())
    .get(ROUTE_HEALTH, async (request, response) => {
        if (STATES[STATES.connected] == STATES[connection.readyState]) {
            response.json({ status: 'UP', dbState: STATES[connection.readyState] });
        } else {
            response.json({ status: 'DOWN', dbState: STATES[connection.readyState] });
        }
    })
    .use(async function (request, response, next) {
        console.log(`HTTP: in middleware checking if I need to update guildID (and channelID), guildID status: ${request.session.guildConfig ? true : false}`);
        try {
            const requestUrl = new URL(request.url, `${request.protocol}://${request.headers.host}`);
            const guildID = requestUrl.searchParams.get('guildID');
            if (guildID) {
                if (!request.session.guildConfig || request.session.guildConfig.guildID != guildID) {
                    console.log(`HTTP: Retrieving guild info for ${guildID}`);
                    const guildConfig = await GuildModel.findOne({ guildID: guildID });
                    if (guildConfig) {
                        request.session.guildConfig = guildConfig;
                    }
                }
            } else if (!request.session.guildConfig && request.session.discordMe) {
                console.log(`HTTP: Retrieving any guild for user, ${request.session.discordMe.id}`);
                const userConfig = await UserModel.findOne({ userID: request.session.discordMe.id });
                //@todo this doesn't use the confirmGuildConfig and really should ... however, i need to make it distributed cluster aware first.
                const guildConfig = userConfig ? await GuildModel.findOne({ guildID: userConfig.guildID }) : undefined;
                if (guildConfig) {
                    request.session.guildConfig = guildConfig;
                }
            } else {
                console.log(`HTTP: Don't need to (or can't) retrieve a guild ...`);
            }
            const channelID = requestUrl.searchParams.get('channel');
            if (channelID) {
                request.session.channelID = channelID;
            }
            next();
        } catch (error) {
            console.error("HTTP: guildID/channelID middleware error", error);
            response.setHeader('Content-Type', 'text/html');
            response.status(500);
            response.end("ERROR PROCESSING");
        }
    })
    .get(ROUTE_ROOT, function (request, response) {
        response.render('index', { title: 'Home', Config: Config, guildConfig: request.session.guildConfig, discordMe: request.session.discordMe });
    })
    .get(ROUTE_LOGOUT, async (request, response) => {
        try {
            console.log('HTTP: serving ' + ROUTE_LOGOUT);
            request.session.discordMe = undefined;
            console.debug('base url: ', request.baseUrl);
            response.redirect(ROUTE_ROOT);
        }
        catch (error) {
            console.error(error.message);
            response.setHeader('Content-Type', 'text/html');
            response.status(500);
            response.end(error.message);
        }
    })
    .get(ROUTE_POSTOAUTH, async (request, response) => {
        try {
            console.info('HTTP: serving ' + ROUTE_POSTOAUTH);
            // let requestUrl = new URL(request.url, `${request.protocol}://${request.headers.host}`);
            if (!request.session.grant || !request.session.grant.response || !request.session.grant.response.raw) {
                // console.log('grant config', grant.config);
                response.redirect(grant.config.discord.prefix + "/discord");
            } else if (request.session.grant.response.error) {
                throw new Error(`Discord API error: ${request.session.grant.response.error.error}`);
            } else {
                // console.log(`oauth2 grant response info`, request.session.grant);
                if (!request.session.discordMe) {
                    console.info('HTTP: Making discord.com/api/users/@me call');
                    let discordMeResponse = await fetch('https://discord.com/api/users/@me', {
                        headers: {
                            authorization: `${request.session.grant.response.raw.token_type} ${request.session.grant.response.access_token}`,
                        },
                    });
                    let discordMe = await discordMeResponse.json();
                    if (discordMeResponse.status != 200 || discordMe.error) {
                        throw new Error(`Discord response code; ${discordMeResponse.status} Discord API error: ${discordMe.error}`);
                    };
                    request.session.discordMe = discordMe;
                }
                var queryString = Object.keys(request.session.grant.dynamic).map(key => key + '=' + request.session.grant.dynamic[key]).join('&');
                console.info(`HTTP: redirect to actual page requested ${request.session.grant.dynamic.destination}?${queryString}`);
                response.redirect(`${request.session.grant.dynamic.destination}?${queryString}`);
            }
        } catch (error) {
            console.error(error.message);
            response.setHeader('Content-Type', 'text/html');
            response.status(500);
            response.end(error.message);
        }
    })
    .get(ROUTE_CALENDAR, async (request, response) => {
        try {
            console.log('HTTP: serving ' + ROUTE_CALENDAR);
            const requestUrl = new URL(request.url, `${request.protocol}://${request.headers.host}`);
            let userID = requestUrl.searchParams.get('userID');
            const interactive = requestUrl.searchParams.get('interactive');
            const excludeGuild = requestUrl.searchParams.get('exclude') ? requestUrl.searchParams.get('exclude').split(',') : [];
            if (!userID && request.session.discordMe) {
                // console.log(`have discordMe, setting userID`);
                userID = request.session.discordMe.id;
            }
            if (!userID) {
                // console.log(`don't have userID, redirecting to discord to login`);
                request.query.destination = ROUTE_CALENDAR;
                response.redirect(url.format({
                    pathname: grant.config.discord.prefix + "/discord",
                    query: request.query,
                }));
            } else {
                // console.log(`have userid, heading to handleCalendarRequest`);
                let responseContent = await calendar.handleCalendarRequest(userID, excludeGuild);
                if (interactive || !request.session.discordMe) {
                    response.setHeader('Content-Type', 'text/calendar');
                    response.end(responseContent);
                }
                else if (request.session.discordMe) {
                    response.render('calendar', { title: 'Calendar', Config: Config, guildConfig: request.session.guildConfig, discordMe: request.session.discordMe });
                } else {
                    throw new Error('Unkown Request');
                }
            }
        } catch (error) {
            console.error('calendar:', error);
            response.setHeader('Content-Type', 'text/html');
            response.status(500);
            response.end(error.message);
        }
    })
    // all routes past this point require authentication
    .use(async function (request, response, next) {
        const desiredDestination = request.path;
        console.log(`HTTP: in middleware, ensuring user is logged in for ${desiredDestination}`);
        // console.log('desiredDestination ' + desiredDestination);
        if (!request.session.discordMe) {
            console.log(`HTTP: user is _not_ logged in, redirecting`);
            request.query.destination = desiredDestination;
            response.redirect(url.format({
                pathname: grant.config.discord.prefix + "/discord",
                query: request.query,
            }));
        } else {
            console.log(`HTTP: ${request.session.discordMe.username} user is logged in`);
            next();
        }
    })
    .get(ROUTE_TIMEZONESSET, async function (request, response) {
        try {
            console.log('HTTP: serving ' + ROUTE_TIMEZONESSET);
            if (request.session.guildConfig) {
                console.log('HTTP: we know the guild so we can set the timezone for user.');
                let requestUrl = new URL(request.url, `${request.protocol}://${request.headers.host}`);
                // console.log(request.session.discordMe);
                // console.log(requestUrl);
                const timezoneToSet = requestUrl.searchParams.get('timezone');
                let status = await manager.broadcastEval(async (client, { discordMeId, channelId, timezoneToSet, guildId }) => {
                    return await client.dnd_users.bc_setUsersTimezone(
                        discordMeId,
                        channelId,
                        timezoneToSet,
                        guildId);
                }, {
                    context: {
                        discordMeId: request.session.discordMe.id,
                        channelId: request.session.channelID,
                        timezoneToSet: timezoneToSet,
                        guildId: request.session.guildConfig.guildID
                    }
                });
                console.log(`HTTP: users.bc_setUsersTimezone response: ${status.includes(true)}`);
                response.json({ status: status.includes(true) });
            } else {
                console.log(`HTTP: we don't know the guild so we will error and let the user copy/paste`);
                response.json({ status: 'false' });
            }
        } catch (error) {
            console.error(`error: route: ${ROUTE_TIMEZONESSET} - ${error.message}`);
            response.setHeader('Content-Type', 'text/html');
            response.status(500);
            response.json({ status: 'false' });
        }
    })
    .get(ROUTE_TIMEZONES, function (request, response) {
        try {
            console.log('HTTP: serving ' + ROUTE_TIMEZONES);
            let requestUrl = new URL(request.url, `${request.protocol}://${request.headers.host}`);
            // console.log(request.session.discordMe);
            let responseData = timezones.handleTimezonesDataRequest(requestUrl);
            response.render('timezones', { title: 'Timezones', timezoneData: responseData, Config: Config, guildConfig: request.session.guildConfig, discordMe: request.session.discordMe })
        } catch (error) {
            console.error(error.message);
            response.setHeader('Content-Type', 'text/html');
            response.status(500);
            response.end(error.message);
        }
    })
    .get(ROUTE_EVENTS, async function (request, response) {
        try {
            console.log('HTTP: serving ' + ROUTE_EVENTS);
            let requestUrl = new URL(request.url, `${request.protocol}://${request.headers.host}`);
            // console.log(request.session.discordMe);
            let eventID = requestUrl.searchParams.get('eventID');
            let event = await EventModel.findById(eventID);
            if (event?.userID != request.session.discordMe.id) {
                console.log(`HTTP: event is not owned by current user, dereferencing`);
                event = undefined;
            }
            let userConfig = await UserModel.findOne({ userID: request.session.discordMe.id, guildID: request.session.guildConfig.guildID });
            // console.log(userConfig);
            response.render('events', { title: 'Events', event: event, Config: Config, guildConfig: request.session.guildConfig, discordMe: request.session.discordMe, userConfig: userConfig })
        } catch (error) {
            console.error(error.message);
            response.setHeader('Content-Type', 'text/html');
            response.status(500);
            response.end(error.message);
        }
    })
    .post(ROUTE_EVENTSSET, async (request, response) => {
        try {
            console.log('HTTP: serving ' + ROUTE_EVENTSSET);
            // console.log(request.body);
            let status = false;
            if (request.session.guildConfig) {
                if (request.body._id) {
                    console.log(`HTTP: must be an edit ... _id exists ${request.body._id}`);
                    let channelIDForEvent = request.session.guildConfig.channelForEvents ? request.session.guildConfig.channelForEvents : request.session.channelID;
                    // @todo build eventString;
                    let eventString = '';

                    //eventID, currUserId, channelIDForEvent, guildID, guildApprovalRole, eventString
                    status = await manager.broadcastEval(
                        `this.dnd_users.bc_eventEdit
                        ('${request.body._id}',
                        '${request.session.discordMe.id}',
                        '${channelIDForEvent}',
                        '${request.session.guildConfig.guildID}',
                        '${request.session.guildConfig.arole}',
                        '${request.session.guildConfig.eventRequireApprover}',
                        '${eventString}');`
                    );
                } else {
                    // @todo implement create
                    console.log(`HTTP: new event, no _id`);
                    //currUserId, channelIDForEvent, guildID, eventString
                    status = await manager.broadcastEval(
                        `this.dnd_users.bc_eventCreate
                        ('${request.session.discordMe.id}',
                        '${request.session.grant.dynamic.channel}',
                        '${timezoneToSet}',
                        '${request.session.guildConfig.guildID}',
                        '${request.session.guildConfig.arole}',
                        '${request.session.guildConfig.eventRequireApprover}');`
                    );
                }
            }
            response.json({ status: status });
        } catch (error) {
            console.error(error.message);
            response.setHeader('Content-Type', 'text/html');
            response.status(500);
            response.end(error.message);
        }
    })
    .listen(Config.httpServerPort);

console.log('HTTP: http server listening on: %s', Config.httpServerPort);

// process.on('exit', () => {
//     console.info('exit signal received.');
//     cleanShutdown(false);
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
    // await cleanShutdown(true);
});

/**
 *
 * @param {boolean} callProcessExit
 */
async function cleanShutdown(callProcessExit) {
    shutdown = true;
    try {
        console.log('Closing out manager resources...');
        await server.close();
        console.log('Http server closed.');
        for ([number, shard] of manager.shards) {
            if (manager.mode == 'process') {
                let count = 0;
                while (shard.process?.exitCode === null) {
                    if (++count > 5) {
                        shard.kill();
                    }
                    console.log(`awaiting shard ${number} to exit`);
                    await new Promise(resolve => setTimeout(resolve, 500));
                }
                // } else if (manager.mode == 'worker') {
            } else {
                console.error(`unknown sharding manager mode: ${manager.mode}`);
            }
        }
        console.log('All shards shutdown.');
        await disconnect();
        console.log('MongoDb connection closed.');
    } catch (error) {
        console.error("caught error shutting down shardmanager", error);
    }
    if (callProcessExit) {
        console.log('Exiting.');
        process.exit(0);
    }
}