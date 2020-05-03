const Discord = require('discord.js');
const {DMChannel} = require('discord.js');
const ytdl = require('ytdl-core');

const Configs = require('./Configs');
configs = Configs.getInstance();

const {token} = require('./config.json');

const client = new Discord.Client();

client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
});

client.on('message', async message => {

    if (!(message.channel instanceof DMChannel)) {
        return;
    }

    console.log(message.content);

    if (message.content !== 'config') {
        return;
    }

    const user = message.author;

    message.channel.send(`Entre l'ID du server à configurer`).then((messageIDGuild) => {
        const filter = m => {
            let reponse = parseInt(m.content);
            return user.id === m.author.id && !isNaN(reponse);
        };
        message.channel.awaitMessages(filter, {time: 60000, max: 1, errors: ['time']}).then(messages => {

            const guild = client.guilds.cache.get(messages.first().content);

            if (!guild) {
                throw new Error("Aucun server correspondant.");
            }

            message.channel.send(`Entre l'ID du channel vocal à rattacher`).then(messageIDVocal => {

                const filter = m => {
                    let reponse = parseInt(m.content);
                    return user.id === m.author.id && !isNaN(reponse)
                };

                message.channel.awaitMessages(filter, {time: 60000, max: 1, errors: ['time']}).then(messages => {

                    const voiceChannel = guild.channels.cache.get(messages.first().content);

                    if (!voiceChannel) {
                        throw new Error("Aucun channel vocal correspondant.");
                    }


                    message.channel.send(`Entre l'url de la vidéo YouTube à lire`).then(messageUrl => {

                        const filter = m => {
                            return user.id === m.author.id && ytdl.validateURL(m.content)
                        };


                        message.channel.awaitMessages(filter, {time: 60000, max: 1, errors: ['time']})
                            .then(messages => {

                                const url = messages.first().content;

                                configs.addConfig(guild, voiceChannel, url);

                            })
                            .catch((err) => {
                                message.channel.send(err.message);
                            });


                    }).catch((err) => {
                        message.channel.send(err.message);
                    });

                }).catch((err) => {
                    message.channel.send(err.message);
                });


            }).catch((err) => {
                message.channel.send(err.message);
            });

        }).catch((err) => {
            message.channel.send(err.message);
        });
    }).catch((err) => {
        message.channel.send(err.message);
    });

});


client.on('voiceStateUpdate', (oldMember, newMember) => {
    if (oldMember.member.user.bot) return;

    let oldUserChannel = oldMember.channel;
    let newUserChannel = newMember.channel;

    // User Joins a voice channel
    if (newUserChannel !== null) {
        let config = configs.getConfigOfGuild(newUserChannel.guild);
        if (config && config.voiceChannelID === newUserChannel.id && !clientIsInVoiceChannel(newUserChannel)) {
            // play
            play(newUserChannel, config.url);

        }
    }
    // User leaves a voice channel
    if (oldUserChannel !== null) {
        let config = configs.getConfigOfGuild(oldUserChannel.guild);
        if (config && config.voiceChannelID === oldUserChannel.id && clientIsInVoiceChannel(oldUserChannel)) {
            if (oldUserChannel.members.filter(gm => gm.user.bot === false).size === 1) {
                oldUserChannel.leave();
            }
        }
    }

    // bot = botsManager.getBotInVoiceChannel(oldUserChannel);
    // if (bot !== null && oldUserChannel.members.size === 1) {
    //     const playlist = bot.playlists.get(oldMember.guild.id);
    //     if (playlist) {
    //         playlist.stop();
    //     }
    // }
});

async function play(voiceChannel, url){
    let connection = await voiceChannel.join();

    let streamDispatcher = await connection
        .play(ytdl(url, {
            quality: 'highestaudio',
            filter: 'audioonly'
        }))
        .on("finish", () => {
            play(voiceChannel, url);
        })
        .on("error", error => console.error(error));
    streamDispatcher.setVolume(0.1);
}

function clientIsInVoiceChannel(voiceChannel) {
    let connections = client.voice.connections;
    if (connections.has(voiceChannel.guild.id)) {
        if (connections.get(voiceChannel.guild.id).channel.id === voiceChannel.id) {
            return true;
        }
    }
    return false;
}

client.login(token);