// For Manifold SDK
process.env.NODE_ENV = 'production';

import { ChatInputCommandInteraction, Client, Collection, GatewayIntentBits, Interaction, Routes, SlashCommandBuilder } from 'discord.js';
import {REST} from '@discordjs/rest';
import * as path from 'path';
import {fileURLToPath} from 'url';
import * as fs from 'fs';
import * as dotenv from 'dotenv';

dotenv.config();
for (const required of ['TOKEN', 'CLIENT_ID']) {
	if (!process.env[required]) {
		console.error(`${required} is not set - must be an environment variable or in .env file`);
		process.exit(1);
	}
}

// Load commands
process.stdout.write('Loading commands... ');
export const commands = new Collection<string, {data: SlashCommandBuilder, execute: ((interaction: ChatInputCommandInteraction) => Promise<any>)}>();
const commandsPath = path.join(path.dirname(fileURLToPath(import.meta.url)), 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter((file: string) => file.endsWith('s'));

for (const file of commandFiles) {
	const filePath = path.join(commandsPath, file);
	const command = await import(filePath);
	// Set a new item in the Collection
	// With the key as the command name and the value as the exported module
	commands.set(command.data.name, command);
}
console.log('OK');

const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

process.stdout.write('Logging in... ');
const client = new Client({intents: [GatewayIntentBits.Guilds]});
client.on('interactionCreate', async interaction => {
	if (!interaction.isChatInputCommand()) return;
	const command = commands.get(interaction.commandName);
	if (!command) return;

	try {
		await command.execute(interaction);
	} catch (error) {
		console.error(error);
		await interaction.reply({ content: 'There was an error while executing this command :(', ephemeral: true });
	}
});

client.login(process.env.TOKEN);
console.log('OK');

process.stdout.write('Refreshing slash commands... ');
try {
	await rest.put(
		Routes.applicationCommands(process.env.CLIENT_ID),
		{ body: commands.mapValues(c => c.data.toJSON()) },
	);

	console.log(`${[...commands.values()].map(x => '/' + x.data.name).join(", ")}`);
} catch (error) {
	console.log('ERROR');
	console.error(error);
}

