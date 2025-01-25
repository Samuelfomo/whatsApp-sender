const qrcode = require('qrcode-terminal');
const { Client } = require('whatsapp-web.js');
const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const client = new Client();

client.on('qr', qr => {
    qrcode.generate(qr, {small: true});
    console.log('Scannez le QR code avec WhatsApp');
});

client.on('ready', () => {
    console.log('Client WhatsApp connecté!');
    startProcess();
});

async function getGroups() {
    try {
        const chats = await client.getChats();
        const groups = chats.filter(chat =>
            chat.isGroup ||
            (chat.id && chat.id._serialized && chat.id._serialized.endsWith('@g.us'))
        );

        console.log(`Total group chats detected: ${groups.length}`);
        groups.forEach((group, index) => {
            console.log(`Group ${index + 1}:
            Name: ${group.name || 'Unnamed Group'}
            ID: ${group.id._serialized}
            `);
        });

        return groups;
    } catch (error) {
        console.error('Error retrieving groups:', error);
        return [];
    }
}

async function getGroupParticipants(groupId) {
    try {
        const chat = await client.getChatById(groupId);

        if (!chat.groupMetadata || !chat.groupMetadata.participants) {
            console.error('Impossible de récupérer les participants du groupe');
            return [];
        }

        const memberNumbers = chat.groupMetadata.participants
            .filter(p => p.id && !p.isMe)
            .map(participant => participant.id.user);

        console.log(`Nombre de membres du groupe : ${memberNumbers.length}`);
        return memberNumbers;
    } catch (error) {
        console.error('Erreur lors de la récupération des participants :', error);
        return [];
    }
}

async function startProcess() {
    try {
        // Lister les groupes
        const groups = await getGroups();
        console.log('\nGroupes disponibles:');
        groups.forEach((group, index) => {
            console.log(`${index + 1}. ${group.name}`);
        });

        // Sélectionner un groupe
        const groupIndex = parseInt(await askQuestion('\nEntrez le numéro du groupe: ')) - 1;
        const selectedGroup = groups[groupIndex];

        if (!selectedGroup) {
            throw new Error('Groupe invalide');
        }

        // Récupérer les participants
        console.log('\nExtraction des numéros du groupe...');
        const numbers = await getGroupParticipants(selectedGroup.id._serialized);
        console.log(`${numbers.length} numéros extraits`);

        // Demander le message
        const message = await askQuestion('\nEntrez le message à envoyer: ');

        // Envoyer les messages
        console.log('\nEnvoi des messages...');
        for (const number of numbers) {
            try {
                await client.sendMessage(number + '@c.us', message);
                console.log(`✓ Message envoyé à ${number}`);
                await new Promise(resolve => setTimeout(resolve, 1000));
            } catch (error) {
                console.error(`✗ Erreur pour ${number}: ${error.message}`);
            }
        }

        console.log('\nEnvoi terminé!');
        process.exit(0);
    } catch (error) {
        console.error('Erreur:', error);
        process.exit(1);
    }
}

function askQuestion(question) {
    return new Promise(resolve => rl.question(question, resolve));
}

client.initialize();