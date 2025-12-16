import { Client, Events, GatewayIntentBits } from "discord.js";

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] });

client.once(Events.ClientReady, c => {
    console.log(`Logged in as ${c.user.tag}`);
});

client.on(Events.MessageCreate, message => {
    if (message.mentions.has(client.user!)) {
        message.reply("Hello! You mentioned me!");
    }
})

client.login(process.env.DISCORD_TOKEN)