const { MessageEmbed } = require('discord.js');
const fetch = require('node-fetch');
const CharModel = require('../models/Character');
const UserModel = require('../models/User');
const users = require('../handlers/users.js');
const utils = require('../utils/utils.js');
const { Types } = require('mongoose');

const StatLookup = { 1: 'Strength', 2: 'Dexterity', 3: 'Constitution', 4: 'Intelligence', 5: 'Wisdom', 6: 'Charisma' };
const SkillLookup = {
    '3': 'acrobatics', '11': 'animalHandling', '6': 'arcana', '2': 'athletics', '16': 'deception', '7': 'history',
    '12': 'insight', '17': 'intimidation', '8': 'investigation', '13': 'medicine', '9': 'nature', '14': 'perception',
    '18': 'performance', '19': 'persuasion', '10': 'religion', '4': 'sleightOfHand', '5': 'stealth', '15': 'survival'
}
const RacialBonusLookup = {
    1: { 'Mountain Dwarf': 2, 'Dragonborn': 2, 'Half-Orc': 2, 'Human': 1 },
    2: { 'Elf': 2, 'Halfling': 2, 'Forest Gnome': 1, 'Human': 1 },
    3: { 'Dwarf': 2, 'Stout halfling': 1, 'Rock Gnome': 1, 'Half-Orc': 1, 'Human': 1 },
    4: { 'High Elf': 1, 'Gnome': 2, 'Tiefling': 1, 'Human': 1 },
    5: { 'Hill Dwarf': 1, 'Wood Elf': 1, 'Human': 1 },
    6: { 'Half-Elf': 2, 'Drow': 1, 'Lightfoot Halfling': 1, 'Dragonborn': 1, 'Tiefling': 2, 'Human': 1 }
};

const RaceLookup = [{
    name: 'Mountain Dwarf',
    value: 'Mountain Dwarf'
},
{
    name: 'Dragonborn',
    value: 'Dragonborn'
},
{
    name: 'Half-Orc',
    value: 'Half-Orc'
},
{
    name: 'Human',
    value: 'Human'
},
{
    name: 'Elf',
    value: 'Elf'
},
{
    name: 'Halfling',
    value: 'Halfling'
},
{
    name: 'Forest Gnome',
    value: 'Forest Gnome'
},
{
    name: 'Dwarf',
    value: 'Dwarf'
},
{
    name: 'Stout halfling',
    value: 'Stout halfling'
},
{
    name: 'Rock Gnome',
    value: 'Rock Gnome'
},
{
    name: 'High Elf',
    value: 'High Elf'
},
{
    name: 'Gnome',
    value: 'Gnome'
},
{
    name: 'Tiefling',
    value: 'Tiefling'
},
{
    name: 'Hill Dwarf',
    value: 'Hill Dwarf'
},
{
    name: 'Wood Elf',
    value: 'Wood Elf'
},
{
    name: 'Half-Elf',
    value: 'Half-Elf'
},
// {
//     name: 'Drow',
//     value: 'Drow'
// },
{
    name: 'Lightfoot Halfling',
    value: 'Lightfoot Halfling'
},
// {
//     name: 'Orc of Exandria',
//     value: 'Orc of Exandria'
// },
// {
//     name: 'Leonin',
//     value: 'Leonin'
// },
// {
//     name: 'Satyr',
//     value: 'Satyr'
// },
// {
//     name: 'Aarakocra',
//     value: 'Aarakocra'
// },
// {
//     name: 'Genasi',
//     value: 'Genasi'
// },
{
    name: 'Goliath',
    value: 'Goliath'
},
// {
//     name: 'Aasimar',
//     value: 'Aasimar'
// },
{
    name: 'Bugbear',
    value: 'Bugbear'
},
{
    name: 'Firbolg',
    value: 'Firbolg'
},
// {
//     name: 'Goblin',
//     value: 'Goblin'
// },
// {
//     name: 'Hobgoblin',
//     value: 'Hobgoblin'
// },
// {
//     name: 'Kenku',
//     value: 'Kenku'
// },
// {
//     name: 'Kobold',
//     value: 'Kobold'
// },
// {
//     name: 'Lizardfolk',
//     value: 'Lizardfolk'
// },
// {
//     name: 'Orc',
//     value: 'Orc'
// },
{
    name: 'Tabaxi',
    value: 'Tabaxi'
},
// {
//     name: 'Triton',
//     value: 'Triton'
// },
{
    name: 'Yuan-ti Pureblood',
    value: 'Yuan-ti Pureblood'
},
// {
//     name: 'Feral Tiefling',
//     value: 'Feral Tiefling'
// },
// {
//     name: 'Tortle',
//     value: 'Tortle'
// },
{
    name: 'Changling',
    value: 'Changling'
},
// {
//     name: 'Kalashtar',
//     value: 'Kalashtar'
// },
// {
//     name: 'Orc of Eberron',
//     value: 'Orc of Eberron'
// },
// {
//     name: 'Shifter',
//     value: 'Shifter'
// },
{
    name: 'Warforged',
    value: 'Warforged'
},
// {
//     name: 'Gith',
//     value: 'Gith'
// },
// {
//     name: 'Centaur',
//     value: 'Centaur'
// },
// {
//     name: 'Loxodon',
//     value: 'Loxodon'
// },
// {
//     name: 'Minotaur',
//     value: 'Minotaur'
// },
// {
//     name: 'Simic Hybrid',
//     value: 'Simic Hybrid'
// },
// {
//     name: 'Vedalken',
//     value: 'Vedalken'
// },
// {
//     name: 'Verdan',
//     value: 'Verdan'
// },
// {
//     name: 'Locathah',
//     value: 'Locathah'
// },
// {
//     name: 'Grung',
//     value: 'Grung'
// },
// {
//     name: 'Dhampir (UA)',
//     value: 'Dhampir (UA)'
// },
// {
//     name: 'Fairy (UA)',
//     value: 'Fairy (UA)'
// },
// {
//     name: 'Hexblood (UA)',
//     value: 'Hexblood (UA)'
// },
// {
//     name: 'Hobgoblin of the Feywild (UA)',
//     value: 'Hobgoblin of the Feywild (UA)'
// },
// {
//     name: 'Owlfolk (UA)',
//     value: 'Owlfolk (UA)'
// },
// {
//     name: 'Rabbitfolk (UA)',
//     value: 'Rabbitfolk (UA)'
// },
// {
//     name: 'Reborn (UA)',
//     value: 'Reborn (UA)'
// },
{
    name: 'Other Race',
    value: 'Other Race'
}];

const ClassLookup = [{
    name: 'Barbarian',
    value: 'Barbarian'
}, {
    name: 'Bard',
    value: 'Bard'
}, {
    name: 'Cleric',
    value: 'Cleric'
}, {
    name: 'Druid',
    value: 'Druid'
}, {
    name: 'Fighter',
    value: 'Fighter'
}, {
    name: 'Monk',
    value: 'Monk'
}, {
    name: 'Paladin',
    value: 'Paladin'
}, {
    name: 'Ranger',
    value: 'Ranger'
}, {
    name: 'Rogue',
    value: 'Rogue'
}, {
    name: 'Sorcerer',
    value: 'Sorcerer'
}, {
    name: 'Warlock',
    value: 'Warlock'
}, {
    name: 'Wizard',
    value: 'Wizard'
}, {
    name: 'Artificer',
    value: 'Artificer'
}, {
    name: 'Blood Hunter',
    value: 'Blood Hunter'
}, {
    name: 'Other Class',
    value: 'Other Class'
}];

/**
 * Parse the incoming url for the character id and then use
 * https://character-service.dndbeyond.com/character/v3/character/xxxxxx
 * to retrieve the json
 * @param {Message} msg
 * @param {Array} paramArray
 * @param {GuildModel} guildConfig
 */
async function handleRegister(msg, paramArray, guildConfig) {
    try {
        const charID = parseCharIdFromURL(paramArray[0].value);
        const settings = { method: "Get" };
        let response = await fetch(Config.dndBeyondCharServiceUrl + charID, settings);
        let charJSON = await response.json();
        if (response.status != 200 || charJSON.success == false) {
            throw new Error('Sorry, that URL or dndbeyond-id contains no character data');
        };
        let charData = Object.assign({}, charJSON.data);
        const req = await CharModel.findOne({ id: charData.id, isUpdate: false, guildID: msg.guild.id });
        if (req) {
            // console.log(req);
            throw new Error('Sorry, this character has already been registered, use `update` command instead.');
        }
        let char = new CharModel(charData);
        char.guildUser = msg.member.id;
        char.guildID = msg.guild.id;
        if (guildConfig.requireCharacterApproval) {
            char.approvalStatus = false;
        } else {
            char.approvalStatus = true;
            char.approvedBy = msg.guild.me.id;
        }
        await char.save();
        await utils.sendDirectOrFallbackToChannel({ name: 'Register', value: `<@${msg.member.id}>, ${char.name} / ${char.race.fullName} / ${char.classes[0].definition.name} is now registered` }, msg);
        utils.deleteMessage(msg);
    } catch (error) {
        await utils.sendDirectOrFallbackToChannelError(error, msg);
    }
}

/**
 * create a stub character with params [CHARACTER_NAME] [CHARACTER_CLASS] [CHARACTER_LEVEL] [CHARACTER_RACE] {CAMPAIGN}
 * @param {Message} msg
 * @param {Array} paramArray
 * @param {GuildModel} guildConfig
 */
async function handleRegisterManual(msg, paramArray, guildConfig) {
    try {
        // const paramArray = msgParms.split(' ');
        if (paramArray.length < 4) {
            throw new Error('Not enough parameters passed.');
        }
        let char = new CharModel();
        char.id = Types.ObjectId();
        char.name = paramArray[0].value;
        char.classes = [];
        char.classes[0] = { definition: { name: paramArray[1].value }, level: paramArray[2].value };
        char.race.fullName = paramArray[3].value;
        if (paramArray.length > 4) {
            char.campaignOverride = '';
            for (let i = 4; i < paramArray.length; i++) {
                char.campaignOverride += paramArray[i].value + ' ';
            }
            char.campaignOverride = char.campaignOverride.substring(0, char.campaignOverride.length - 1);
        }
        char.guildUser = msg.member.id;
        char.guildID = msg.guild.id;
        if (guildConfig.requireCharacterApproval) {
            char.approvalStatus = false;
        } else {
            char.approvalStatus = true;
            char.approvedBy = msg.guild.me.id;
        }
        await char.save();
        await utils.sendDirectOrFallbackToChannel({ name: 'Register Manual', value: `<@${msg.member.id}>, ${char.name} / ${char.race.fullName} / ${char.classes[0].definition.name} is now registered` }, msg);
        utils.deleteMessage(msg);
    } catch (error) {
        await utils.sendDirectOrFallbackToChannelError(error, msg);
    }
}

/**
 *
 * @param {String} commandStringWithURL
 * @param {String} command
 * @param {String} prefix
 * @returns {String}
 */
function parseCharIdFromURL(msgParms) {
    let charID;
    try {
        // console.debug('parseCharIdFromURL: msgParms: ' + msgParms);
        let urlSplitArray = msgParms.split('/');
        charID = urlSplitArray.pop();
        // console.debug('parseCharIdFromURL: charID: "' + charID + '"');
        if (isNaN(charID) || isNaN(parseInt(charID))) {
            charID = urlSplitArray.pop();
            // console.debug('parseCharIdFromURL: charID: "' + charID + '"');
            if (isNaN(charID) || isNaN(parseInt(charID))) {
                throw new Error("Invalid URL passed for your registration, it needs to be a dndbeyond character URL.");
            }
        }
        console.debug(`parseCharIdFromURL: msgParms: ${msgParms} charID: ${charID}`);
    } catch (error) {
        throw new Error(`Could not locate character id in URL passed ${msgParms}`);
    }
    return charID;
}

/**
 * Parse the incoming url for the character id and then use
 * https://character-service.dndbeyond.com/character/v3/character/xxxxxx
 * to retrieve the json
 * @param {Message} msg
 * @param {Array} paramArray
 * @param {GuildModel} guildConfig
 */
async function handleUpdate(msg, paramArray, guildConfig) {
    try {
        const charID = parseCharIdFromURL(paramArray[0].value);
        const settings = { method: "Get" };
        let response = await fetch(Config.dndBeyondCharServiceUrl + charID, settings);
        let charJSON = await response.json();
        if (response.status != 200 || charJSON.success == false) {
            throw new Error('Sorry, that URL or dndbeyond-id contains no character data');
        };
        let charData = Object.assign({}, charJSON.data);
        const checkRegisterStatus = await CharModel.findOne({ id: charData.id, isUpdate: false, guildID: msg.guild.id, guildUser: msg.member.id });
        if (!checkRegisterStatus) {
            throw new Error('Sorry, this character has not been registered and approved yet.  `register ' + charData.id + '` it first.');
        } else if (checkRegisterStatus.approvalStatus == false) {
            throw new Error('Sorry, this character is currently pending register approval.  `remove ' + charData.id + '` and then re-register if you would like to replace the `register` request');
        }
        // charData.id = charData.id + '_update';
        const req = await CharModel.findOne({ id: charData.id, guildUser: msg.member.id, isUpdate: true, guildID: msg.guild.id });
        if (req) {
            throw new Error('Sorry, this character has already has an update pending.  `remove ' + charData.id + '` if you would like to replace the update request');
        }
        let char = checkRegisterStatus;
        if (guildConfig.requireCharacterApproval) {
            char = new CharModel(charData);
            char.approvalStatus = false;
            char.isUpdate = true;
            char.guildUser = msg.member.id;
            char.guildID = msg.guild.id;
            char.campaignOverride = checkRegisterStatus.campaignOverride;
            char.approvedBy = checkRegisterStatus.approvedBy;
        } else {
            char.overwrite(charData);
            char.approvalStatus = true;
            char.isUpdate = false;
            char.guildUser = msg.member.id;
            char.guildID = msg.guild.id;
            char.campaignOverride = checkRegisterStatus.campaignOverride;
            char.approvedBy = msg.guild.me.id;
        }
        await char.save();
        await utils.sendDirectOrFallbackToChannel({ name: 'Update', value: `<@${msg.member.id}>, ${stringForCharacter(char)} now has been updated.` }, msg);
        utils.deleteMessage(msg);
    } catch (error) {
        await utils.sendDirectOrFallbackToChannelError(error, msg);
    }
}

/**
 * update a stub character with params [CHARACTER_NAME] [CHARACTER_CLASS] [CHARACTER_LEVEL] [CHARACTER_RACE] {CAMPAIGN}
 * @param {Message} msg
 * @param {Array} paramArray
 * @param {GuildModel} guildConfig
 */
async function handleUpdateManual(msg, paramArray, guildConfig) {
    try {
        // const parameters = msg.content.substring((guildConfig.prefix + 'update manual').length + 1);
        // const paramArray = parameters.split(' ');
        //        if (paramArray.length < 5) {

        if (paramArray.length < 5) {
            //@todo allow updates to not require all fields
            //       && !paramArray.find(p => {
            //     returnValue = (p.name == COMMANDS.updateManual.options[0].name);
            //     console.debug(`${p.name} ?? ${COMMANDS.updateManual.options[0].name} = ${returnValue}`);
            //     return returnValue;
            // }))
            throw new Error('Not enough parameters passed.');
        }
        console.log('guildid %s, userid %s, id %s, isUpdate false', msg.guild.id, msg.member.id, paramArray[0].value);
        let checkRegisterStatus = await CharModel.findOne({ guildID: msg.guild.id, guildUser: msg.member.id, id: paramArray[0].value, isUpdate: false });
        if (!checkRegisterStatus) {
            throw new Error('Sorry, this character has not been registered and approved yet.  `register` and `approve` it first.');
        } else if (checkRegisterStatus.approvalStatus == false) {
            throw new Error('Sorry, this character is currently pending register approval.  `remove ' + paramArray[0].value + '` and then re-register if you would like to replace the `register` request');
        }
        const req = await CharModel.findOne({ id: paramArray[0].value, isUpdate: true, guildID: msg.guild.id, guildUser: msg.member.id });
        if (req) {
            throw new Error('Sorry, this character has already has an update pending.  `remove ' + paramArray[0].value + '` if you would like to replace the update request');
        }
        let char = checkRegisterStatus;
        if (guildConfig.requireCharacterApproval) {
            char = new CharModel({
                id: paramArray[0].value,
                name: paramArray[1].value,
                classes: [{ definition: { name: paramArray[2].value }, level: paramArray[3].value }],
                "race.fullName": paramArray[4].value,
                approvalStatus: false,
                isUpdate: true,
                approvedBy: checkRegisterStatus.approvedBy,
            });
        } else {
            char.overwrite({
                id: paramArray[0].value,
                name: paramArray[1].value,
                classes: [{ definition: { name: paramArray[2].value }, level: paramArray[3].value }],
                "race.fullName": paramArray[4].value,
                approvalStatus: true,
                isUpdate: false,
                approvedBy: msg.guild.me.id,
            });
        }
        if (paramArray.length > 5) {
            char.campaignOverride = '';
            for (let i = 5; i < paramArray.length; i++) {
                char.campaignOverride += paramArray[i].value + ' ';
            }
            char.campaignOverride = char.campaignOverride.substring(0, char.campaignOverride.length - 1);
        }
        char.guildUser = msg.member.id;
        char.guildID = msg.guild.id;
        char.campaignOverride = checkRegisterStatus.campaignOverride;
        await char.save();
        await utils.sendDirectOrFallbackToChannel({ name: 'Update Manual', value: `<@${msg.member.id}>, ${stringForCharacter(char)} now has been updated.` }, msg);
        utils.deleteMessage(msg);
    } catch (error) {
        await utils.sendDirectOrFallbackToChannelError(error, msg);
    }
}

/**
 * Handler for displaying character changes
 * @param {Message} msg
 * @param {Array} msgParms
 * @param {GuildModel} guildConfig
 */
async function handleChanges(msg, msgParms, guildConfig) {
    try {
        const charId = msgParms[0].value;
        let updatedChar = await CharModel.findOne({ id: charId, guildID: msg.guild.id, approvalStatus: false });
        let approvedChar = await CharModel.findOne({ id: charId, guildID: msg.guild.id, approvalStatus: true });
        if (typeof updatedChar === 'undefined' || !updatedChar || typeof approvedChar === 'undefined' || !approvedChar) {
            throw new Error(`an updated character for id "${charId}" could not be located.`);
        } else {
            const changesEmbed = embedForChanges(msg, approvedChar, updatedChar);
            // console.log(changesEmbed);
            await utils.sendDirectOrFallbackToChannelEmbeds(changesEmbed, msg);
        }
        utils.deleteMessage(msg);
    } catch (error) {
        await utils.sendDirectOrFallbackToChannelError(error, msg);
    }
}

/**
 * Create a rich embedded message with all the character changes between two characters
 * @param {Message} msg
 * @param {CharModel} approvedChar
 * @param {CharModel} updatedChar
 * @returns {MessageEmbed}
 */
function embedForChanges(msg, approvedChar, updatedChar) {
    const changesEmbed = new MessageEmbed()
        .setColor(utils.COLORS.BLUE)
        .setTitle(`Review Changes for Character: ${approvedChar.name}`)
        // .setURL('https://discord.js.org/')
        .setAuthor('D&D Vault', Config.dndVaultIcon, `${Config.httpServerURL}/?guildID=${msg.guild?.id}`)
        // .setDescription(description)
        .setThumbnail(msg.guild.iconURL());
    let changes = [];
    changes.push(utils.appendStringsForEmbedChanges(['CHAR FIELD', 'OLD VALUE', 'NEW VALUE']));
    let change = stringForNameChange(approvedChar, updatedChar);
    if (change) changes.push(change);
    change = stringForRaceChange(approvedChar, updatedChar);
    if (change) changes.push(change);
    changes = changes.concat(arrayForClassChange(approvedChar, updatedChar));
    changesEmbed.addFields({ name: 'Core Changes', value: utils.trimAndElipsiseStringArray(changes, 1024) });
    changes = arrayForAbilitiesChange(approvedChar, updatedChar);
    if (changes?.length > 0) {
        changesEmbed.addFields({ name: 'Abilities Changes', value: utils.trimAndElipsiseStringArray(changes, 1024) });
    }
    changes = arrayForBackgroundModifiersChanges(approvedChar, updatedChar);
    if (changes?.length > 0) {
        changesEmbed.addFields({ name: 'Background Changes', value: utils.trimAndElipsiseStringArray(changes, 1024) });
    }
    changes = arrayForClassModifiersChanges(approvedChar, updatedChar);
    if (changes?.length > 0) {
        changesEmbed.addFields({ name: 'Class Changes', value: utils.trimAndElipsiseStringArray(changes, 1024) });
    }
    changes = arrayForConditionModifiersChanges(approvedChar, updatedChar);
    if (changes?.length > 0) {
        changesEmbed.addFields({ name: 'Condition Changes', value: utils.trimAndElipsiseStringArray(changes, 1024) });
    }
    changes = arrayForFeatModifiersChanges(approvedChar, updatedChar);
    if (changes?.length > 0) {
        changesEmbed.addFields({ name: 'Feat Changes', value: utils.trimAndElipsiseStringArray(changes, 1024) });
    }
    changes = arrayForItemModifiersChanges(approvedChar, updatedChar);
    if (changes?.length > 0) {
        changesEmbed.addFields({ name: 'Item Changes', value: utils.trimAndElipsiseStringArray(changes, 1024) });
    }
    changes = arrayForRaceModifiersChanges(approvedChar, updatedChar);
    if (changes?.length > 0) {
        changesEmbed.addFields({ name: 'Race Changes', value: utils.trimAndElipsiseStringArray(changes, 1024) });
    }
    changes = arrayForTraitsChanges(approvedChar, updatedChar);
    if (changes?.length > 0) {
        changesEmbed.addFields({ name: 'Traits Changes', value: utils.trimAndElipsiseStringArray(changes, 1024) });
    }
    changes = arrayForInventoryChanges(approvedChar, updatedChar);
    if (changes?.length > 0) {
        changesEmbed.addFields({ name: 'Inventory Changes', value: utils.trimAndElipsiseStringArray(changes, 1024) });
    }
    changes = arrayForCurrenciesChange(approvedChar, updatedChar);
    if (changes?.length > 0) {
        changesEmbed.addFields({ name: 'Currency Changes', value: utils.trimAndElipsiseStringArray(changes, 1024) });
    }
    return changesEmbed;
}

/**
 * returns an array of currency changes between characters
 * @param {CharModel} approvedChar
 * @param {CharModel} updatedChar
 * @returns {Array}
 */
function arrayForCurrenciesChange(approvedChar, updatedChar) {
    let currenciesChanges = [];
    if (approvedChar.currencies.cp != updatedChar.currencies.cp) {
        currenciesChanges.push(utils.appendStringsForEmbedChanges(['CP', approvedChar.currencies.cp ? '' + approvedChar.currencies.cp : '0', updatedChar.currencies.cp ? '' + updatedChar.currencies.cp : '0']));
    }
    if (approvedChar.currencies.ep != updatedChar.currencies.ep) {
        currenciesChanges.push(utils.appendStringsForEmbedChanges(['EP', approvedChar.currencies.ep ? '' + approvedChar.currencies.ep : '0', updatedChar.currencies.ep ? '' + updatedChar.currencies.ep : '0']));
    }
    if (approvedChar.currencies.gp != updatedChar.currencies.gp) {
        currenciesChanges.push(utils.appendStringsForEmbedChanges(['GP', approvedChar.currencies.gp ? '' + approvedChar.currencies.gp : '0', updatedChar.currencies.gp ? '' + updatedChar.currencies.gp : '0']));
    }
    if (approvedChar.currencies.pp != updatedChar.currencies.pp) {
        currenciesChanges.push(utils.appendStringsForEmbedChanges(['PP', approvedChar.currencies.pp ? '' + approvedChar.currencies.pp : '0', updatedChar.currencies.pp ? '' + updatedChar.currencies.pp : '0']));
    }
    if (approvedChar.currencies.sp != updatedChar.currencies.sp) {
        currenciesChanges.push(utils.appendStringsForEmbedChanges(['SP', approvedChar.currencies.sp ? '' + approvedChar.currencies.sp : '0', updatedChar.currencies.sp ? '' + updatedChar.currencies.sp : '0']));
    }
    return currenciesChanges;
}

/**
 * returns an array of all the race modifiers changes between two characters
 * @param {CharModel} approvedChar
 * @param {CharModel} updatedChar
 * @returns {Array}
 */
function arrayForRaceModifiersChanges(approvedChar, updatedChar) {
    return arrayForModifiersChanges(approvedChar.modifiers.race, updatedChar.modifiers.race);
}

/**
 * returns an array of all the item modifiers changes between two characters
 * @param {CharModel} approvedChar
 * @param {CharModel} updatedChar
 * @returns {Array}
 */
function arrayForItemModifiersChanges(approvedChar, updatedChar) {
    // console.log(' app, upd: %j\n\n %j', approvedChar.modifiers.item, updatedChar.modifiers.item);
    return arrayForModifiersChanges(approvedChar.modifiers.item, updatedChar.modifiers.item);
}

/**
 * returns an array of all the feat modifiers changes between two characters
 * @param {CharModel} approvedChar
 * @param {CharModel} updatedChar
 * @returns {Array}
 */
function arrayForFeatModifiersChanges(approvedChar, updatedChar) {
    // console.log(' app, upd: %j, %j', approvedChar.modifiers.feat, updatedChar.modifiers.feat);
    return arrayForModifiersChanges(approvedChar.modifiers.feat, updatedChar.modifiers.feat);
}

/**
 * returns an array of all the condition modifiers changes between two characters
 * @param {CharModel} approvedChar
 * @param {CharModel} updatedChar
 * @returns {Array}
 */
function arrayForConditionModifiersChanges(approvedChar, updatedChar) {
    return arrayForModifiersChanges(approvedChar.modifiers.condition, updatedChar.modifiers.condition);
}

/**
 * returns an array of all the class modifiers changes between two characters
 * @param {CharModel} approvedChar
 * @param {CharModel} updatedChar
 * @returns {Array}
 */
function arrayForClassModifiersChanges(approvedChar, updatedChar) {
    return arrayForModifiersChanges(approvedChar.modifiers.class, updatedChar.modifiers.class);
}

/**
 * returns an array of all the background modifiers changes between two characters
 * @param {CharModel} approvedChar
 * @param {CharModel} updatedChar
 * @returns {Array}
 */
function arrayForBackgroundModifiersChanges(approvedChar, updatedChar) {
    return arrayForModifiersChanges(approvedChar.modifiers.background, updatedChar.modifiers.background);
}

/**
 * returns an array of all the modifier changes between two characters
 * @param {Array} approvedMod
 * @param {Array} updatedMod
 * @returns {Array}
 */
function arrayForModifiersChanges(approvedMod, updatedMod) {
    approvedMod = concatArrayOfArrays(approvedMod);
    updatedMod = concatArrayOfArrays(updatedMod);
    let modifiersChanges = [];
    // check to see if an array of arrays got passed somehow
    updatedMod.forEach((updTrait) => {
        let foundItem = false;
        approvedMod.forEach((appTrait) => {
            if (updTrait.id == appTrait.id) {
                foundItem = true;
            }
        });
        if (!foundItem) {
            // console.log('updated - did not find: ' + updTrait.id + ' | ' + updTrait.friendlySubtypeName + ' | ' + updTrait.friendlyTypeName);
            modifiersChanges.push(utils.appendStringsForEmbedChanges([updTrait.friendlySubtypeName, '', updTrait.friendlyTypeName + (updTrait.value ? '(' + updTrait.value + ')' : '')]));
        }

    });

    approvedMod.forEach((appTrait) => {
        let foundItem = false;
        updatedMod.forEach((updTrait) => {
            if (updTrait.id == appTrait.id) {
                foundItem = true;
            }
        });
        if (!foundItem) {
            // console.log('approved - did not find: ' + appTrait.id + ' | ' + appTrait.friendlySubtypeName + ' | ' + appTrait.friendlyTypeName);
            modifiersChanges.push(utils.appendStringsForEmbedChanges([appTrait.friendlySubtypeName, appTrait.friendlyTypeName + (appTrait.value ? '(' + appTrait.value + ')' : ''), '']));
        }
    });
    return modifiersChanges;
}

function concatArrayOfArrays(arrays) {
    let returnConcatArray = [];
    arrays.forEach((value) => {
        if (Array.isArray(value)) {
            returnConcatArray = returnConcatArray.concat(value);
        } else {
            returnConcatArray.push(value);
        }
    })
    return returnConcatArray;
}

/**
 * returns an array of all the racial traits changes between two characters
 * @param {CharModel} approvedChar
 * @param {CharModel} updatedChar
 * @returns {Array}
 */
function arrayForTraitsChanges(approvedChar, updatedChar) {
    let traitsChanges = [];
    updatedChar.race.racialTraits.forEach((updTrait) => {
        let foundItem = false;
        approvedChar.race.racialTraits.forEach((appTrait) => {
            if (updTrait.definition.id == appTrait.definition.id) {
                foundItem = true;
            }
        });
        if (!foundItem) {
            // console.log('did not find: ' + updTrait.definition.name);
            traitsChanges.push(utils.appendStringsForEmbedChanges([updTrait.definition.snippet ? updTrait.definition.snippet : updTrait.definition.description, '', updTrait.definition.name]));
        }
    });
    approvedChar.race.racialTraits.forEach((appTrait) => {
        let foundItem = false;
        updatedChar.race.racialTraits.forEach((updTrait) => {
            if (updTrait.definition.id == appTrait.definition.id) {
                foundItem = true;
            }
        });
        if (!foundItem) {
            // console.log('did not find: ' + appTrait.definition.name);
            traitsChanges.push(utils.appendStringsForEmbedChanges([appTrait.definition.snippet ? appTrait.definition.snippet : appTrait.definition.description, appTrait.definition.name, '']));
        }
    });
    return traitsChanges;
}

/**
 * returns an array of all the inventory changes between two characters
 * @param {CharModel} approvedChar
 * @param {CharModel} updatedChar
 * @returns {Array}
 */
function arrayForInventoryChanges(approvedChar, updatedChar) {
    let inventoryChanges = [];
    updatedChar.inventory.forEach((updInv) => {
        let foundItem = false;
        let wrongQty = 0;
        approvedChar.inventory.forEach((appInv) => {
            if (updInv.definition.id == appInv.definition.id && updInv.quantity == appInv.quantity) {
                foundItem = true;
            } else if (updInv.definition.id == appInv.definition.id && updInv.quantity != appInv.quantity) {
                wrongQty = appInv.quantity;
            }
        });
        if (!foundItem) {
            // console.log('did not find: ' + updInv.definition.name);
            inventoryChanges.push(utils.appendStringsForEmbedChanges([updInv.definition.name, '' + wrongQty, '' + updInv.quantity]));
        }
    });
    approvedChar.inventory.forEach((appInv) => {
        let foundItem = false;
        let wrongQty = 0;
        updatedChar.inventory.forEach((updInv) => {
            if (updInv.definition.id == appInv.definition.id && updInv.quantity == appInv.quantity) {
                foundItem = true;
            } else if (updInv.definition.id == appInv.definition.id && updInv.quantity != appInv.quantity) {
                wrongQty = updInv.quantity;
            }
        });
        if (!foundItem) {
            // console.log('did not find: ' + appInv.definition.name);
            inventoryChanges.push(utils.appendStringsForEmbedChanges([appInv.definition.name, '' + appInv.quantity, '' + wrongQty]));
        }
    });
    return inventoryChanges;
}

function arrayForAbilitiesChange(approvedChar, updatedChar) {
    let abilitiesChanges = [];
    approvedChar.stats.forEach((approvedStat) => {
        updatedChar.stats.forEach((updatedStat) => {
            if (approvedStat.id == updatedStat.id) {
                if (approvedStat.value != updatedStat.value) {
                    // console.log('stat is different: ' + StatLookup[approvedStat.id] + ':' + approvedStat.value + '/' + updatedStat.value);
                    abilitiesChanges.push(utils.appendStringsForEmbedChanges([StatLookup[approvedStat.id], '' + approvedStat.value, '' + updatedStat.value]));
                }
            }
        })
    })
    return abilitiesChanges;
}

function arrayForClassChange(approvedChar, updatedChar) {
    let classChanges = [];
    let maxClassesLength = approvedChar.classes.length > updatedChar.classes.length ? approvedChar.classes.length : updatedChar.classes.length;
    for (let i = 0; i < maxClassesLength; i++) {
        // console.log('printing class: ' + stringForClass(approvedChar.classes[i]) + ' | ' + stringForClass(updatedChar.classes[i]));
        if (stringForClass(approvedChar.classes[i]) != stringForClass(updatedChar.classes[i])) {
            classChanges.push(utils.appendStringsForEmbedChanges(['Class', stringForClass(approvedChar.classes[i]), stringForClass(updatedChar.classes[i])]));
        }
    }
    return classChanges;
}

function stringForClass(charClass) {
    if (typeof charClass !== 'undefined' && charClass?.definition) {
        return `${charClass.definition.name}(${charClass.level})` + (charClass.subclassDefinition ? '(' + charClass.subclassDefinition.name + ')' : '');
    } else {
        return '';
    }
}

function stringForClassShort(charClass) {
    if (typeof charClass !== 'undefined' && charClass?.definition) {
        return `${charClass.definition.name}(${charClass.level})`;
    } else {
        return '';
    }
}

function stringForRaceChange(approvedChar, updatedChar) {
    if (approvedChar.race.fullName != updatedChar.race.fullName) {
        return utils.appendStringsForEmbedChanges(['Race', approvedChar.race.fullName, updatedChar.race.fullName]);
    }
}

function stringForNameChange(approvedChar, updatedChar) {
    if (approvedChar.name != updatedChar.name) {
        return utils.appendStringsForEmbedChanges(['Character Name', approvedChar.name, updatedChar.name]);
    }
}

/**
 * list all characters for the campaign requested
 * @param {Message} msg
 * @param {Array} msgParms
 * @param {GuildModel} guildConfig
 */
async function handleListCampaign(msg, msgParms, guildConfig) {
    try {
        let campaignToList = msgParms[0].value;
        let charArrayUpdates = await CharModel.find({ guildID: msg.guild.id, 'campaign.id': campaignToList, approvalStatus: false });

        let notInIds = getIdsFromCharacterArray(charArrayUpdates);
        let charArrayNoUpdates = await CharModel.find({ guildID: msg.guild.id, 'campaign.id': campaignToList, approvalStatus: true, id: { $nin: notInIds } });
        let charArray = charArrayUpdates.concat(charArrayNoUpdates);

        notInIds = notInIds.concat(getIdsFromCharacterArray(charArrayNoUpdates));
        let charArrayOverrideUpdates = await CharModel.find({ guildID: msg.guild.id, campaignOverride: campaignToList, approvalStatus: false, id: { $nin: notInIds } });
        charArray = charArray.concat(charArrayOverrideUpdates);

        notInIds = notInIds.concat(getIdsFromCharacterArray(charArrayNoUpdates));
        let charArrayOverrideNoUpdates = await CharModel.find({ guildID: msg.guild.id, campaignOverride: campaignToList, approvalStatus: true, id: { $nin: notInIds } });
        charArray = charArray.concat(charArrayOverrideNoUpdates);

        if (charArray.length > 0) {
            const charEmbedArray = embedForCharacter(msg, charArray, `All Characters in campaign "${campaignToList}"`, false);
            await utils.sendDirectOrFallbackToChannelEmbeds(charEmbedArray, msg);
            utils.deleteMessage(msg);
        } else {
            throw new Error(`There are no registered characters for that campaign, \`register\` one!`);
        }
    } catch (error) {
        await utils.sendDirectOrFallbackToChannelError(error, msg);
    }
}

function getIdsFromCharacterArray(charArray) {
    let names = [];
    charArray.forEach((char) => {
        names.push(char.id);
    });
    return names;
}

/**
 * list characters for this user
 * @param {Message} msg
 * @param {Array} msgParms
 * @param {GuildModel} guildConfig
 */
async function handleListUser(msg, msgParms, guildConfig) {
    try {
        let userToList = msgParms[0].value;
        userToList = utils.trimTagsFromId(userToList);
        //        if (userToList.startsWith('<')) {
        // console.debug("handleListUser: usertolist:", userToList);
        let memberToList = await msg.guild.members.fetch(userToList);
        let charArrayUpdates = await CharModel.find({ guildUser: userToList, guildID: msg.guild.id, isUpdate: true });
        let notInIds = getIdsFromCharacterArray(charArrayUpdates);
        let charArrayNoUpdates = await CharModel.find({ guildUser: userToList, guildID: msg.guild.id, id: { $nin: notInIds }, isUpdate: false });
        let charArray = charArrayUpdates.concat(charArrayNoUpdates);
        if (charArray.length > 0) {
            const charEmbedArray = embedForCharacter(msg, charArray, `All Characters for ${memberToList.displayName} in the Vault`, false);
            await utils.sendDirectOrFallbackToChannelEmbeds(charEmbedArray, msg);
            utils.deleteMessage(msg);
        } else {
            throw new Error(`I don't see any registered characters for ${userToList}`);
        }
    } catch (error) {
        await utils.sendDirectOrFallbackToChannelError(error, msg);
    }
}

/**
 * returns the MessageEmbed(s) for an array of characters passed
 *
 * @param {Message} msg
 * @param {CharModel[]} charArray
 * @param {String} title
 * @param {Boolean} isShow
 * @param {UserModel} vaultUser
 *
 * @returns {MessageEmbed[]}
 */
function embedForCharacter(msg, charArray, title, isShow, vaultUser) {
    let returnEmbeds = [];
    // return 3 characters for show and 8 characters for a list
    let charPerEmbed = isShow ? 3 : 8;
    let charEmbed = new MessageEmbed()
        .setColor(utils.COLORS.BLUE)
        .setTitle(title)
        // .setURL('https://discord.js.org/')
        .setAuthor('D&D Vault', Config.dndVaultIcon, `${Config.httpServerURL}/?guildID=${msg.guild?.id}`)
        // .setDescription(description)
        .setThumbnail(msg.guild.iconURL());
    let i = 0;
    charArray.forEach((char) => {
        if (i++ >= charPerEmbed) {
            returnEmbeds.push(charEmbed);
            charEmbed = new MessageEmbed()
                .setColor(utils.COLORS.BLUE);
            i = 0;
        }
        // console.log('vaultuser', vaultUser);
        let defCharString = vaultUser?.defaultCharacter == char.id ? ` ${utils.EMOJIS.ASTERISK}` : '';
        let charNameString = isShow ? `[${char.name}](${char.readonlyUrl})${defCharString}` : `[${stringForCharacter(char)}](${char.readonlyUrl})`;
        // console.log('defCharString "%s" and "%s"', defCharString, char.id);
        charEmbed.addFields(
            {
                name: `\:dagger: User | Char | ID | Status | Campaign \:shield:`,
                value: `<@${char.guildUser}> | ${charNameString} | ${char.id} | ${stringForApprovalsAndUpdates(char)} | ${stringForCampaign(char)}`
            }
        );
        // let campaignString = stringForCampaign(char);
        // if (campaignString) {
        //     charEmbed.addFields({ name: 'Campaign', value: campaignString, inline: true });
        // }
        if (isShow) {
            charEmbed.addFields(
                // { name: 'User', value: `<@${char.guildUser}>`, inline: true },
                { name: 'Race', value: `[${char.race.fullName}](${Config.dndBeyondUrl}${char.race.moreDetailsUrl})`, inline: true },
                {
                    name: 'Class', value: char.classes.length > 0 ? stringForClass(char.classes[0]) :
                        // `[${char.classes[0].definition.name}](${Config.dndBeyondUrl}${char.classes[0].definition.moreDetailsUrl})` :
                        '?', inline: true
                },
                { name: 'Attributes*', value: stringForStats(char), inline: true }
            );
        }
    });
    returnEmbeds.push(charEmbed);
    return returnEmbeds;
}

function stringForCharacter(char) {
    let classes = '';
    char.classes.forEach((theClass) => {
        classes += stringForClass(theClass);
    });
    return `${char.name} / ${char.race.fullName} / ${classes}`;
}

function stringForCharacterShort(char) {
    if (!char) {
        return '';
    }
    let classes = '';
    char.classes.forEach((theClass) => {
        classes += stringForClassShort(theClass);
    });
    return `${char.name} the ${classes}`;
}

function stringForCampaign(char) {
    const dndCampaign = char.campaign?.name
        ? `DDB: [${char.campaign.name}](${Config.dndBeyondUrl}/campaigns/${char.campaign.id}) (${char.campaign.id})`
        : undefined;
    let returnCampaign = 'No Campaign Set';
    if (dndCampaign && char.campaignOverride) {
        returnCampaign = char.campaignOverride + '\n' + dndCampaign;
    } else if (char.campaignOverride) {
        returnCampaign = char.campaignOverride;
    } else if (dndCampaign) {
        returnCampaign = dndCampaign;
    }
    return returnCampaign;
}

/**
 *
 * @param {CharModel} char
 */
function stringForStats(char) {
    if (char.stats.length < 1) {
        return "N/A";
    }
    let charStatsString = '';
    char.stats.forEach((stat) => {
        let bonus = RacialBonusLookup[stat.id][char.race.baseRaceName] ? RacialBonusLookup[stat.id][char.race.baseRaceName] : 0;
        bonus += RacialBonusLookup[stat.id][char.race.fullName] ? RacialBonusLookup[stat.id][char.race.fullName] : 0;
        let indivStat = stat.value + bonus;
        let modifier = Math.floor((indivStat - 10) / 2);
        charStatsString = charStatsString + `${StatLookup[stat.id].substring(0, 3)}: ${indivStat}(${modifier}) | `;
    });
    return charStatsString.substring(0, charStatsString.length - 3);
}

/**
 * Return a string describing the current state of the character
 * @param {CharModel} char
 * @returns {String}
 */
function stringForApprovalsAndUpdates(char) {
    if (char.approvalStatus && char.isUpdate) {
        return '`Invalid Status`';
    } else if (!char.approvalStatus && char.isUpdate) {
        return "`Update Pending Approval`";
    } else if (char.approvalStatus && !char.isUpdate) {
        return `Approved by <@${char.approvedBy}> `;
    } else if (!char.approvalStatus && !char.isUpdate) {
        return "`Register Pending Approval`";
    }
}

/**
 * list all characters in guild
 * @param {Message} msg
 * @param {Array} msgParms
 * @param {GuildModel} guildConfig
 */
async function handleListAll(msg, msgParms, guildConfig) {
    try {
        let charArrayUpdates = await CharModel.find({ guildID: msg.guild.id, isUpdate: true });
        let notInIds = getIdsFromCharacterArray(charArrayUpdates);
        let charArrayNoUpdates = await CharModel.find({ guildID: msg.guild.id, id: { $nin: notInIds }, isUpdate: false });
        let charArray = charArrayUpdates.concat(charArrayNoUpdates);
        if (charArray.length > 0) {
            const charEmbedArray = embedForCharacter(msg, charArray, 'All Characters in the Vault', false);
            await utils.sendDirectOrFallbackToChannelEmbeds(charEmbedArray, msg);
            utils.deleteMessage(msg);
        } else {
            throw new Error(`I don't see any registered characters \`register\` one!`);
        }
    } catch (error) {
        await utils.sendDirectOrFallbackToChannelError(error, msg);
    }
}

/**
 * list all characters queued for approval
 * @param {Message} msg
 * @param {Array} msgParms
 * @param {GuildModel} guildConfig
 */
async function handleListQueued(msg, msgParms, guildConfig) {
    try {
        const charArray = await CharModel.find({ guildID: msg.guild.id, approvalStatus: false });
        if (charArray.length > 0) {
            const charEmbedArray = embedForCharacter(msg, charArray, 'Characters pending approval');
            await utils.sendDirectOrFallbackToChannelEmbeds(charEmbedArray, msg);
            utils.deleteMessage(msg);
        } else {
            throw new Error(`I don't see any queued changes to characters awaiting approval right now ... go play some D&D!`);
        }
    } catch (error) {
        await utils.sendDirectOrFallbackToChannelError(error, msg);
    }
}

/**
 *
 * @param {Message} msg
 * @param {Array} msgParms
 * @param {GuildModel} guildConfig
 */
async function handleList(msg, msgParms, guildConfig) {
    try {
        let vaultUser = await UserModel.findOne({ guildID: msg.guild.id, userID: msg.member.id });
        // console.log('handlelist vaultuser', vaultUser);
        let charArrayUpdates = await CharModel.find({ guildUser: msg.member.id, guildID: msg.guild.id, isUpdate: true });
        let notInIds = getIdsFromCharacterArray(charArrayUpdates);
        let charArrayNoUpdates = await CharModel.find({ guildUser: msg.member.id, guildID: msg.guild.id, id: { $nin: notInIds }, isUpdate: false });
        let charArray = charArrayUpdates.concat(charArrayNoUpdates);
        if (charArray.length > 0) {
            const charEmbedArray = embedForCharacter(msg, charArray, `${msg.member.displayName}'s Characters in the Vault`, false, vaultUser);
            await utils.sendDirectOrFallbackToChannelEmbeds(charEmbedArray, msg);
            utils.deleteMessage(msg);
        } else {
            throw new Error(`There are no registered characters for you, \`register\` one`);
        }
    } catch (error) {
        await utils.sendDirectOrFallbackToChannelError(error, msg);
    }
}

/**
 * remove a character (or pending update) from the vault, if username is passed, remove for that user
 * @param {Message} msg
 * @param {Array} msgParms
 * @param {GuildModel} guildConfig
 */
async function handleRemove(msg, msgParms, guildConfig) {
    try {
        let typeOfRemoval = 'Character Update';
        let charIdToDelete = msgParms[0].value;
        let forUser = msgParms.length > 1 ? msgParms[1].value : msg.member.id;
        forUser = utils.trimTagsFromId(forUser);
        console.log('handleRemove: about to remove charid %s for user %s', charIdToDelete, forUser);
        // we only want to remove one type of character, not every character (if there is an update pending).  so remove update, if it
        // doesn't exist, then remove the actual registered character
        let deleteResponse = await CharModel.deleteMany({ guildUser: forUser, id: charIdToDelete, guildID: msg.guild.id, isUpdate: true, approvalStatus: false });
        if (deleteResponse.deletedCount < 1) {
            typeOfRemoval = 'Unapproved Character';
            deleteResponse = await CharModel.deleteMany({ guildUser: forUser, id: charIdToDelete, guildID: msg.guild.id, isUpdate: false, approvalStatus: false });
            if (deleteResponse.deletedCount < 1) {
                typeOfRemoval = 'Approved Character';
                if (await users.hasRoleOrIsAdmin(msg.member, guildConfig.arole)) {
                    deleteResponse = await CharModel.deleteMany({ guildUser: forUser, id: charIdToDelete, guildID: msg.guild.id, isUpdate: false, approvalStatus: true });
                } else {
                    throw new Error(`Please ask an <@&${guildConfig.arole}> to remove this character, as it has already been approved`);
                }
            }
        }
        await utils.sendDirectOrFallbackToChannel({ name: 'Remove', value: `<@${msg.member.id}>, ${charIdToDelete} (${typeOfRemoval}) was removed (${deleteResponse.deletedCount} records) from vault.` }, msg);
        utils.deleteMessage(msg);
    } catch (error) {
        await utils.sendDirectOrFallbackToChannelError(error, msg);
    }
}

/**
 * approve a new/updated character within vault
 * @param {Message} msg
 * @param {Array} msgParms
 * @param {GuildModel} guildConfig
 */
async function handleApprove(msg, msgParms, guildConfig) {
    try {
        if (await users.hasRoleOrIsAdmin(msg.member, guildConfig.arole)) {
            const charIdToApprove = msgParms[0].value;
            // const charIdToApprove = msg.content.substring((guildConfig.prefix + 'approve').length + 1);
            // console.log('charid: ' + charIdToApprove);
            let charToApprove = await CharModel.findOne({ id: charIdToApprove, guildID: msg.guild.id, approvalStatus: false });
            if (typeof charToApprove === 'undefined' || !charToApprove) {
                throw new Error(`<@${msg.member.id}>, an unapproved "${charIdToApprove}" could not be located.`)
                // await msg.channel.send(`<@${msg.member.id}>, an unapproved "${charIdToApprove}" could not be located.`);
                // await msg.delete();
            } else {
                // console.log('char: ' + charToApprove);
                charToApprove.approvalStatus = true;
                charToApprove.approvedBy = msg.member.id;
                // if this is an update, then remove the original - this update will become the registered character
                if (charToApprove.isUpdate = true) {
                    charToApprove.isUpdate = false;
                    await CharModel.deleteMany({ id: charIdToApprove, guildID: msg.guild.id, isUpdate: false, approvalStatus: true });
                }
                await charToApprove.save();
                await utils.sendDirectOrFallbackToChannel({ name: 'Approve', value: `<@${msg.member.id}>, ${stringForCharacter(charToApprove)} was approved.` }, msg);
                utils.deleteMessage(msg);
            }
        } else {
            throw new Error(`please ask an \`approver role\` to approve.`);
        }
    } catch (error) {
        await utils.sendDirectOrFallbackToChannelError(error, msg);
    }
}

/**
 * show a user's character from the vault
 * @param {Message} msg
 * @param {Array} msgParms
 * @param {GuildModel} guildConfig
 */
async function handleShow(msg, msgParms, guildConfig) {
    try {
        const charID = msgParms[0].value;
        // const charID = msg.content.substring((guildConfig.prefix + 'show').length + 1);
        const showUser = (await CharModel.find({ id: charID, guildID: msg.guild.id }).sort({ isUpdate: 'desc' }))[0];
        if (!showUser) {
            throw new Error(`That character (${charID}) doesn't exist`);
        }
        const embedsChar = embedForCharacter(msg, [showUser], 'Show Character', true);
        await utils.sendDirectOrFallbackToChannelEmbeds(embedsChar, msg);
        utils.deleteMessage(msg);
    } catch (error) {
        await utils.sendDirectOrFallbackToChannelError(error, msg);
    }
}

/**
 * allow editing of campaign to override dndbeyond
 * @param {Message} msg
 * @param {Array} msgParms
 * @param {GuildModel} guildConfig
 */
async function handleCampaign(msg, msgParms, guildConfig) {
    try {
        if (msgParms.length < 1) {
            throw new Error('Please pass the (in the least) the character id.');
        }
        const charID = msgParms[0]?.value;
        const campaignID = msgParms[1]?.value;
        // console.log(`charid: ${charID} campaignID: ${campaignID}`);

        const charToEdit = await CharModel.findOne({ guildUser: msg.member.id, id: charID, isUpdate: false, guildID: msg.guild.id });
        if (!charToEdit) {
            throw new Error(`No (approved) character (${charID}) found for your id.`);
        }
        charToEdit.campaignOverride = campaignID;
        await charToEdit.save();
        await utils.sendDirectOrFallbackToChannel({ name: 'Campaign', value: `Character ${charID} campaign changed to \`${campaignID ? campaignID : 'No Campaign Override'}\`` }, msg);
        utils.deleteMessage(msg);
    } catch (error) {
        await utils.sendDirectOrFallbackToChannelError(error, msg);
    }
}

exports.handleRegister = handleRegister;
exports.handleUpdate = handleUpdate;
exports.handleListCampaign = handleListCampaign;
exports.handleListUser = handleListUser;
exports.handleListAll = handleListAll;
exports.handleListQueued = handleListQueued;
exports.handleList = handleList;
exports.handleRemove = handleRemove;
exports.handleApprove = handleApprove;
exports.handleShow = handleShow;
exports.handleChanges = handleChanges;
exports.handleCampaign = handleCampaign;
exports.stringForCharacterShort = stringForCharacterShort;
exports.handleRegisterManual = handleRegisterManual;
exports.handleUpdateManual = handleUpdateManual;
exports.ClassLookup = ClassLookup;
exports.RaceLookup = RaceLookup;
