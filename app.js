
/* lodobot - a random bot for shits and giggles
 * 2021 - Daniel Mania
 * TODO: start using good coding practices
 */

require('dotenv').config()
const Discord = require('discord.js');
const client = new Discord.Client();
const schedule = require('node-schedule');
var SpotifyWebApi = require('spotify-web-api-node');
const fs = require('fs');
const ytdl = require('ytdl-core');
const yts = require('yt-search');
const { MessageActionRow, MessageButton } = require('discord-buttons');
const disbut = require('discord-buttons')(client);


var spotifyApi = new SpotifyWebApi({
    clientId: process.env.SPOTI_CL_ID,
    clientSecret: SPOTI_CL_SCR,
    redirectUri: 'http://www.example.com/callback'
});

// spotify integration tests, may come in handy later, for now unused

/* spotifyApi.clientCredentialsGrant().then(
    function (data) {
        //console.log('The access token expires in ' + data.body['expires_in']);
        //console.log('The access token is ' + data.body['access_token']);

        // Save the access token so that it's used in future calls
        spotifyApi.setAccessToken(data.body['access_token']);

        spotifyApi.getPlaylist('37i9dQZF1DXd1MXcE8WTXq')
            .then(function (data) {
                console.log('Some information about this playlist', data.body.tracks.items);
            }, function (err) {
                console.log('Something went wrong!', err);
            }); 
    },
    function (err) {
        console.log('Something went wrong when retrieving an access token', err);
    }
);

async function spoti_test() {
    const creds = await spotifyApi.clientCredentialsGrant()
    await spotifyApi.setAccessToken(creds.body['access_token'])
    const playlist = await spotifyApi.getPlaylist('37i9dQZF1DXd1MXcE8WTXq')
    console.log(playlist.body.tracks.items)
} */

// some internal info for the bot to use, TODO: clean that stuff up

let is_playing = false
let queue = new Array()
let conn = null
let vc = null

const prefix = './';
const botColor = 0xcf58d1

let jump_number = 0

// config placeholder, no better idea, but gets the job done for now, TODO: come up with a better way to store the config

let config = {
    papaj: false,
    krzykacz: false
}


function sendToLog(user, mess) { // simple logging function 
    const date = new Date()
    console.log('[' + date.toLocaleString("pl-PL") + '] ' + '[' + user + ']' + ': ' + mess)
}

// music player related helper functions

async function get_info(link) {
    let info = await ytdl.getInfo(link)
    ytdl.chooseFormat(info.formats, { quality: 'highestaudio' })
    return info
}

function play_file(msg) {
    const curr_info = queue[0]
    sendToLog(msg.member.user.tag, 'Odtwarzanie: ' + curr_info.videoDetails.title)
    msg.channel.send({
        embed: {
            color: botColor,
            fields: [
                {
                    name: 'Odtwarzanie:',
                    value: curr_info.videoDetails.title
                }
            ]
        }
    })

    is_playing = true
    const dispatcher = conn.play(ytdl.downloadFromInfo(curr_info))
        .on("finish", () => {
            is_playing = false
            queue.shift()
            if (queue[0]) {
                sendToLog('play_file(after finish)', 'rekurencja, next')
                play_file(msg)
            }
            else {
                sendToLog('play_file(after finish)', 'koniec kolejki')
                vc.leave()
            }

        })

}

client.on('ready', () => {
    sendToLog(client.user.tag, 'Dołączono')
    client.user.setActivity(
        'wpisz "' + prefix + 'help"', {
        type: "LISTENING"
    }
    );
    const papaj_job = schedule.scheduleJob('* 37 21 * * *', async function () {  // plays barka everyday at 21:37
        if (config.papaj == true) {
            if (!is_playing) {
                const all_voice = client.guilds.cache.get('804799693581975594').channels.cache.get('804802536551743569').children
                //console.log(all_voice)
                const with_users = all_voice.find(function (channel) {
                    //console.log(channel.members.array())
                    return channel.members.array().length > 0
                })
                //console.log(with_users)
                if (with_users) {
                    sendToLog(client.user.tag, 'Bareczka leci')
                    const conn = await with_users.join()
                    const playing = conn.play('./audio/barka.mp3')
                    is_playing = true
                    playing.on('finish', end => {
                        is_playing = false
                        with_users.leave()
                    })
                }
                else {
                    sendToLog(client.user.tag, 'Nikogo nie ma na papieżową')
                    is_playing = false
                }
            }
        }
    })

    const jump_job = schedule.scheduleJob('*/5 * * * * *', function () { // reset number of jumps between channels every 5 secs, TODO: place it somewhere where it belongs
        jump_number = 0
    })
});

client.on('message', async msg => {
    // do nothing if the message is from the bot or it doesn't use the set prefix

    if (msg.author.bot) return;
    if (!msg.content.startsWith(prefix)) return;

    /* parse the message into a separate object containing the command and it's parameters
      * eg. ./config something on is parsed into:
      * message.command = config
      * params[0] = something
      * params[1] = on
      * it's a surprise tool that will help us later
      * TODO: make it take up one line instead of five like a dumbass
      * */

    const full = msg.content.toLowerCase()
    const full_no_pref = full.substring(prefix.length)
    const split = full_no_pref.split(' ')
    const command = split.shift()
    const params = split

    const message = {
        command: command,
        params: params
    }

    sendToLog(msg.member.user.tag, 'wysłano ' + JSON.stringify(message))

    if (message.command === 'help') { // help message with a list of commands, TODO: somehow make it translatable
        const messageEmbed = {
            color: botColor,
            title: 'lodobot v21.3.7',
            description: 'Dostępne komendy:',
            fields: [
                {
                    name: prefix + 'loda?',
                    value: 'spytaj się bota czy to pora na loda ekipy'
                },
                {
                    name: prefix + 'nie wiem',
                    value: 'ty no nie wiem'
                },
                {
                    name: prefix + 'drzwi',
                    value: 'po chuj napierdalasz w te drzwi psychopatko jebana'
                },
                {
                    name: prefix + 'p link do youtube/termin wyszukiwania',
                    value: 'odtwarza coś lub dodaje do kolejki'
                },
                {
                    name: prefix + 'q',
                    value: 'wyświetla kolejkę utworów'
                },
                {
                    name: prefix + 'skip',
                    value: 'przeskakuje do następnego utworu w kolejce'
                }
            ]
        }
        msg.channel.send({ embed: messageEmbed })
    }
    if (message.command === 'nie_wiem') { // plays one of the sounds on the voice channel of the caller, and leaves
        const vc = msg.member.voice.channel
        if (is_playing) return
        if (!vc) {
            msg.channel.send({
                embed: {
                    color: botColor,
                    fields: [
                        {
                            name: 'Błąd',
                            value: 'Musisz być na kanale głosowym!'
                        }
                    ]
                }
            })
            return
        }
        try {
            const conn = await vc.join()
            const playing = conn.play('./audio/ty-no-nie-wiem.mp3')
            playing.on('finish', end => {
                is_playing = false
                vc.leave()
            })
        }
        catch (err) {
            console.log(err)
        }
    }

    if (message.command === 'loda?') { 
        msg.reply('a pytasz dzika czy sra w lesie? zawsze jest pora na looooooda')
    }

    if (message.command === 'drzwi') { // copy and paste from the previous audio player, TODO: turn it into a function that plays any audio file
        const vc = msg.member.voice.channel
        if (is_playing) return
        if (!vc) {
            msg.channel.send({
                embed: {
                    color: botColor,
                    fields: [
                        {
                            name: 'Błąd',
                            value: 'Musisz być na kanale głosowym!'
                        }
                    ]
                }
            })
            return
        }
        try {
            const conn = await vc.join()
            const playing = conn.play('./audio/drzwi.mp3')
            is_playing = true
            playing.on('finish', end => {
                is_playing = false
                vc.leave()
            })
        }
        catch (err) {
            console.log(err)
        }
    }
    if (message.command === 'shee') { // ditto, see how dumb this is
        const vc = msg.member.voice.channel
        if (is_playing) return
        if (!vc) {
            msg.channel.send({
                embed: {
                    color: botColor,
                    fields: [
                        {
                            name: 'Błąd',
                            value: 'Musisz być na kanale głosowym!'
                        }
                    ]
                }
            })
            return
        }
        try {
            const conn = await vc.join()
            const playing = conn.play('./audio/shee.wav')
            is_playing = true
            playing.on('finish', end => {
                is_playing = false
                vc.leave()
            })
        }
        catch (err) {
            console.log(err)
        }
    }

    if (message.command === 'play' || message.command === 'p') { // youtube music player, currently very broken and freezes the bot often, TODO: fix this
        vc = msg.member.voice.channel
        if (!vc) {
            msg.channel.send({
                embed: {
                    color: botColor,
                    fields: [
                        {
                            name: 'Błąd',
                            value: 'Musisz być na kanale głosowym!'
                        }
                    ]
                }
            })
            return
        }

        let link = null
        sendToLog('song', message.params[0])
        if (message.params[0].startsWith('https://youtube.com/watch?v=') || message.params[0].startsWith('https://www.youtube.com/watch?v=')) {
            link = message.params[0]
        }
        else {
            const results = await yts(message.params.join(' '))
            link = results.all[0].url
        }
        const info = await get_info(link)
        msg.channel.send({
            embed: {
                color: botColor,
                fields: [
                    {
                        name: 'Dodano do kolejki:',
                        value: info.videoDetails.title
                    }
                ]
            }
        })
        queue.push(info)
        if (!is_playing) {
            conn = await vc.join()
            play_file(msg)
        }

    }
    if (message.command === 'stop') {
        vc = msg.member.voice.channel
        vc.leave()
        is_playing = false
    }
    if (message.command === 'skip' || message.command === 's') {
        vc = msg.member.voice.channel
        if (!vc) {
            msg.channel.send({
                embed: {
                    color: botColor,
                    fields: [
                        {
                            name: 'Błąd',
                            value: 'Musisz być na kanale głosowym!'
                        }
                    ]
                }
            })
            return
        }
        if (!queue) {
            msg.channel.send({
                embed: {
                    color: botColor,
                    fields: [
                        {
                            name: 'Błąd',
                            value: 'Kolejka jest pusta!'
                        }
                    ]
                }
            })
            return
        }
        conn.dispatcher.end()
    }
    if (message.command === 'queue' || message.command === 'q') {
        vc = msg.member.voice.channel
        if (!vc) {
            msg.channel.send({
                embed: {
                    color: botColor,
                    fields: [
                        {
                            name: 'Błąd',
                            value: 'Musisz być na kanale głosowym!'
                        }
                    ]
                }
            })
            return
        }
        if (!queue.length) {
            msg.channel.send({
                embed: {
                    color: botColor,
                    fields: [
                        {
                            name: 'Błąd',
                            value: 'Kolejka jest pusta!'
                        }
                    ]
                }
            })
            return
        }
        const embed = {
            embed: {
                color: botColor,
                fields: [
                    {
                        name: 'Kolejka: ',
                        value: 'Kolejka odtwarzania'
                    }
                ]
            }
        }
        queue.forEach(function (song, i) {
            embed.embed.fields.push({
                name: i + '. ' + song.videoDetails.title,
                value: 'x'
            })
        })
        msg.channel.send(embed)
    }

    /* if (message.command === 'game') { // idea for making a game lobby automatically, TODO: get working on this 
        let button = new MessageButton()
            .setLabel("Zagraj!")
            .setStyle('blurple')
            .setID('play_button')
        await msg.channel.send(`${msg.author.username} chce zagrać! Kolejka: \n${msg.author.username}`, button);
    } */

    /* client.on('clickButton', async (button) => {
    await button.message.edit('Ktoś mie kliknął uwu')
}); */

    if (message.command === 'config') { // config management, not very pretty but works well
        if (!msg.member.roles.cache.some(role => role.id === '866777290330341427')) { // checking for the "jebani programiści" role so that everyone can't change the settings
            msg.channel.send('oj nie nie byniu tobie nie wolno tego używać')
            return
        }
        if (message.params[0] === 'papaj') {
            if (message.params[1] === 'on') {
                msg.channel.send('papaj on')
                config.papaj = true
            }
            else if (message.params[1] === 'off') {
                msg.channel.send('papaj off')
                config.papaj = false
            }
            else if (!message.params[1]) {
                if (config.papaj == true) msg.channel.send('status papaja: on')
                else msg.channel.send('status papaja: off')
            }
            else {
                msg.channel.send('nie kumam szefie')
            }
        }
        else if (message.params[0] === 'krzykacz') {
            if (message.params[1] === 'on') {
                msg.channel.send('krzykacz on')
                config.krzykacz = true
            }
            else if (message.params[1] === 'off') {
                msg.channel.send('krzykacz off')
                config.krzykacz = false
            }
            else if (!message.params[1]) {
                if (config.krzykacz == true) msg.channel.send('status krzykacza: on')
                else msg.channel.send('status krzykacza: off')
            }
            else {
                msg.channel.send('nie kumam szefie')
            }
        }
        else {
            msg.channel.send('sorry szefie, nie znam takiej opcji')
        }
    }
});


client.on('voiceStateUpdate', (memberBeforeJoin, memberAfterJoin) => { // screams a message on a channel if people are moving around channels waaaay too fast
    if (config.krzykacz == true) {
        // don't scream if a user is jumping around the ping-pong channels on our server, it's a looong story
        if (memberAfterJoin.channelID != '848546786032615436' || memberAfterJoin.channelID != '848546824498315274' || memberAfterJoin.channelID != '849004787188891659' || memberAfterJoin.channelID != '848546799186214962') {
            jump_number++
        }
        if (jump_number > 5) { // more than 5 jumps in 5 seconds
            client.channels.cache.get('804802612171767828').send(`PRZESTAŃCIE SIĘ KURWA PRZERZUCAĆ`)
        }
    }
})

client.login(process.env.DSC_TOKEN);
