import { ChatInputCommandInteraction } from "discord.js";
import { Manifold, FullMarket } from "manifold-sdk";
import { manifoldMap } from "./storage";

// Channel ID : Market ID
export const channelMarkets: {[k: string]: string} = {};

export async function getAPIInstance(interaction: ChatInputCommandInteraction) {
    if (!interaction.user?.id || !manifoldMap[interaction.user.id]) {
        await interaction.editReply('You must first register your API key with /register');
        return null;
    }
    const key = manifoldMap[interaction.user.id];
    return new Manifold(key);
}

const api = new Manifold();
const marketsCache = {
    // No guarantees about order except that the newest market is always in markets[0]
    markets: await api.getAllMarkets(),
    updateTime: Date.now()
};

export async function allMarkets() {
    // cache still valid for 60 seconds
    if ((Date.now() - marketsCache.updateTime) < 1000 * 60) return marketsCache.markets;

    const newestInCacheID = marketsCache.markets[0].id;
    infloop: for (;;) {
        const newest1000Markets = await api.getMarkets({});
        if (!newest1000Markets.length) {
            marketsCache.updateTime = Date.now();
            return marketsCache.markets;
        }

        for (const market of newest1000Markets) {
            if (market.id === newestInCacheID) break infloop;
            marketsCache.markets.unshift(market);
        }
    }

    marketsCache.updateTime = Date.now();
    return marketsCache.markets;
}

export async function getMarketByTitle(query: string, options?: {exact: boolean}) {
    query = query.toLowerCase().trim();
    for (const m of (await allMarkets())) {
        if (options?.exact) {
            if (m.question.toLowerCase().trim() === query) return api.getMarket({id: m.id});
        } else {
            if (m.question.toLowerCase().includes(query)) return api.getMarket({id: m.id});
        }
    }
    return null;
}

export async function getMarketByID(id: string) {
    try {
        return api.getMarket({id});
    } catch (e) {
        return null;
    }
}