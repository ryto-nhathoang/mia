import 'dotenv/config';
import { PlayerManager } from 'ziplayer';
import { Client, GatewayIntentBits } from 'discord.js';
import { SoundCloudPlugin, SpotifyPlugin, YouTubePlugin } from '@ziplayer/plugin';
import { InfinityPlugin } from '@ziplayer/infinity';

const prefix = "!";

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.MessageContent,
    ],
});

const player = new PlayerManager({
    plugins: [
        new SoundCloudPlugin(),
        new SpotifyPlugin(),
        new YouTubePlugin(),
        new InfinityPlugin(),
    ],
});

player.on("trackStart", (queue, track) => {
    // Code xử lý sự kiện của bạn ở đây
});
player.on("trackAdd", (queue, track) => {
    queue.userdata?.channel?.send(`Added to queue: **${track.title}**`);
});
player.on("playerError", (queue, error, track) => {
    console.error(`Playback error${track ? ` for "${track.title}"` : ""}:`, error);
});

client.on("clientReady", () => {
    console.log(`Logged in as ${client.user.tag}!`);
});

client.on("messageCreate", async (message) => {
    if (message.author.bot || !message.guild) return;
    if (!message.content.startsWith(prefix)) return;
    const args = message.content.slice(1).trim().split(/ +/g);
    const command = args.shift().toLowerCase();
    if (command === "play") {
        if (!args[0]) 
        return message.channel.send("Please provide a song name or URL.");
            if (!message.member.voice.channel)
            return message.channel.send("You need to be in a voice channel to play music.");
    let queue;
    try {
        queue = await player.create(message.guild.id, {
            userdata: {
                channel: message.channel,
            },
            selfDeaf: true,
        });
        if (!queue.connection) await queue.connect(message.member.voice.channel);
        const success = await queue.play(args.join(" "), message.author.id);
        if (!success) return message.channel.send("Could not find or start that track. Check the bot console for errors.");
        return message.channel.send(`Loading track: **${args.join(" ")}**`);
    }   catch (e) {
        console.error("Could not connect or start playback:", e);
        if (queue && !queue.isPlaying) queue.destroy();
        return message.channel.send("Could not connect or start playback. Check the bot console for errors.");
    }
}   

const queue = player.get(message.guild.id);
if (!queue)
    return message.channel.send("No music is being played!");

if (command === "stop") {
    await queue.disconnect();
    queue.destroy();
    return message.channel.send("Stopped the music and left the voice channel.");
}

if (!queue.isPlaying)
    return message.channel.send("No music is being played!");

    else if (command === "skip") {
        
        queue.skip();
        message.channel.send("Skipped the current track.");
}   else if (command === "pause") {
        if (queue.isPaused)
            return message.channel.send("The music is already paused.");
        queue.pause();
        message.channel.send("Paused the music.");
}   else if (command === "resume") {
        if (!queue.isPaused)
            return message.channel.send("The music is not paused.");
        queue.resume();
        message.channel.send("Resumed the music.");
}   else if (command === "queue") {
    const current = queue.currentTrack;
    const list = queue.upcomingTracks
        .map((track, i) => `${i + 1}. ${track.title}`)
        .slice(0, 10).join("\n");
    message.channel.send(
        `**Current Track:**\n${current.title} - ${current.requestedby}\n**Queue:**\n${
            list.length > 0 ? list : "No more tracks in the queue "
        }`
    );
}   else if (command === "volume") {
    if (!args[0]) 
        return message.channel.send(`Current volume: **${queue.volume}**`
    );
    const volume = parseInt(args[0]);
    if (isNaN(volume) || volume < 0 || volume > 100)
        return message.channel.send("Please provide a valid volume between 0 and 100.");
    queue.setVolume(volume);
    message.channel.send(`Volume set to **${volume}**`);
}   else if (command === "nowplaying") {
    const current = queue.currentTrack;
    const progress = queue.getProgressBar();
    message.channel.send(`**Now Playing:** ${current.title}**\n${progress}`);
}   else {
    message.channel.send("Unknown command.");
}
});

client.login(process.env.TOKEN);
