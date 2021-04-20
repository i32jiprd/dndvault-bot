const { DiceRoll } = require('rpg-dice-roller');
const utils = require('../utils/utils.js');

/**
 *
 * @param {Message} msg
 * @param {Array} diceParam
 */
async function handleDiceRoll(msg, diceParam) {
    try {
        const rollit = new DiceRoll(diceParam.map(element => element.value).join(' '));
        // console.debug(`JSON:`, rollit.toJSON());
        // console.debug(`Index of ${rollit.notation} in ${rollit.output} is ${rollit.output.lastIndexOf(':')}`);
        let rollitValut = rollit.output.substring(rollit.output.lastIndexOf(': ') + 2);
        let embedFields = [];
        for (let i = 0; i < rollitValut.length; i += 1000) {
            const cont = rollitValut.substring(i, Math.min(rollitValut.length, i + 1000));
            embedFields.push({ name: `🎲${rollit.notation}🎲`, value: `${cont}` });
        }
        await utils.sendDirectOrFallbackToChannel(embedFields, msg, undefined, true);
        if (msg.deletable) {
            await msg.delete();
        }
    } catch (error) {
        await utils.sendDirectOrFallbackToChannelError(error, msg);
    }
}

exports.handleDiceRoll = handleDiceRoll;