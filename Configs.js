const fs = require('fs');

let instance = null;

module.exports = class Configs {

    /**
     * @returns {Configs}
     */
    static getInstance() {
        if (instance === null) {
            instance = new Configs()
        }

        return instance;
    }

    constructor() {
        if (!fs.existsSync(this.pathFile)) {
            fs.writeFileSync(this.pathFile, '{}', function (err) {
                if (err) {
                    console.log(err);
                }
            });
        }

        this.textChannelsID = require(this.pathFile);
    }

    textChannelsID = {};

    pathFile = './config-textchannel.json';

    addConfig(guild, voiceChannel, url) {
        if (!this.textChannelsID.hasOwnProperty(guild.id)) {
            this.textChannelsID[guild.id] = {
                "voiceChannelID": null,
                "url": null
            }
        }

        this.textChannelsID[guild.id].voiceChannelID = voiceChannel.id;
        this.textChannelsID[guild.id].url = url;

        fs.writeFileSync(this.pathFile, JSON.stringify(this.textChannelsID), function (err) {
            if (err) {
                console.log(err);
            }
        });
    }

    getConfigOfGuild(guild){
        if (this.textChannelsID.hasOwnProperty(guild.id)) {
            return this.textChannelsID[guild.id];
        }
        return null;
    }
};