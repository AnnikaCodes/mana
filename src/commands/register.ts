import {ChatInputCommandInteraction, SlashCommandBuilder} from 'discord.js';
import { Manifold } from 'manifold-sdk';
import { manifoldMap, saveManifoldMap } from '../storage';

export const data = new SlashCommandBuilder()
    .setName('register')
    .setDescription('Registers your Manifold API token')
    .addStringOption(option => option
        .setName('key')
        .setDescription('your Manifold Markets API key')
        .setRequired(true)
    );

export async function execute(interaction: ChatInputCommandInteraction) {
    const key = interaction.options.getString('key')!;

    let me;
    await interaction.reply({content: 'Checking API key...', ephemeral: true});
    let failed = false;
    try {
        const api = new Manifold(key);
        me = await api.getMe();
    } catch (e) {
        failed = true;
    }
    if (failed || !me) {
        await interaction.editReply(`Encountered an error using that API key to connect to Manifold -- are you sure it's valid?`);
        return;
    }

    manifoldMap[interaction.user.id] = key;
    saveManifoldMap();
    await interaction.editReply(`Registered Manifold account ${me.name} to user <@!${interaction.user.id}>`);
}

