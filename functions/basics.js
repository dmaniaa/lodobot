function help(msg, botColor, prefix, type) { //first param is msg/future inter, botColor and prefix are global settings, type is either msg or inter
    const embed = {
        color: botColor,
        title: 'lodobot v21.3.7',
        description: 'Dostêpne komendy:',
        fields: [
            {
                name: prefix + 'loda?',
                value: 'spytaj siê bota czy to pora na loda ekipy'
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
                value: 'odtwarza coœ lub dodaje do kolejki'
            },
            {
                name: prefix + 'q',
                value: 'wyœwietla kolejkê utworów'
            },
            {
                name: prefix + 'skip',
                value: 'przeskakuje do nastêpnego utworu w kolejce'
            }
        ]
    }
    msg.channel.send({ embeds: [embed] })
    return 0;
}
exports.help = help;