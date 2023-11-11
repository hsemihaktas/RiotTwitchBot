const fs = require('fs');
const tmi = require('tmi.js');
const axios = require('axios');
const Fuse = require('fuse.js');
const config = JSON.parse(fs.readFileSync('config.json', 'utf8'));

const APIKEY = config.apikey;

const client = new tmi.Client({ connection: { reconnect: true }, identity: { username: config.twitch.username, password: config.twitch.oauth, }, channels: config.twitch.channels });
client.connect();

client.on('connected', (address, port) => console.log(`${address}:${port}`));

client.on('message', async (channel, userstate, message, self) => {
  if (self || !message.startsWith('!')) return;
  const spaceIndex = message.indexOf(' ');
  const command = spaceIndex !== -1 ? message.substring(0, spaceIndex) : message;
  const commands = [
    { cmd: '!commands,!help', key: 'commands', active: false },
    { cmd: '!tftrank', key: 'tftrank', active: false },
    { cmd: '!tftlastgame,!tftlg', key: 'tftlastmatch', active: false },
    { cmd: '!tftavg', key: 'tftavg', active: false },
    { cmd: '!tftitem,!bis', key: 'tftitem', active: false },
    { cmd: '!lolrank,!rank', key: 'lolrank', active: false },
    { cmd: '!lollastgame,!lastgame,!lg', key: 'lollastmatch', active: false },
    { cmd: '!winrate,!wr', key: 'winrate', active: false },
    { cmd: '!streak', key: 'streak', active: false },
    { cmd: '!mostplayed,!main', key: 'mostplayed', active: false },
    { cmd: '!level,!lv', key: 'level', active: false },
    { cmd: '!runes,!rune,!run', key: 'runes', active: true },
    { cmd: '!matchup,!lolranks,!ranks', key: 'matchup', active: true },
    { cmd: '!avgrank,!elo', key: 'elo', active: true },
    { cmd: '!mastery', key: 'mastery', active: true },
    { cmd: '!levels', key: 'levels', active: true },
    { cmd: '!setregion,!setreg', key: 'setregion', active: undefined },
    { cmd: '!setsummoner,!setsum', key: 'setsummoner', active: undefined },
    { cmd: '!setlanguage,!setlang', key: 'setlanguage', active: undefined }
  ];
  commands.forEach(async ({ cmd, key, active }) => {
    if (config.twitch[channel].lastcommand !== key && cmd.split(',').includes(command)) {
      if (active === undefined) {
        if (userstate.badges && (userstate.badges.moderator || userstate.badges.broadcaster)) {
          const value = spaceIndex !== -1 ? message.substring(spaceIndex + 1) : '';
          if (key === 'setregion') {
            const data = ['na1', 'br1', 'la1', 'la2', 'jp1', 'kr', 'eun1', 'euw1', 'tr1', 'ru', 'oc1', 'ph2', 'sg2', 'th2', 'tw2', 'vn2'];
            const fuse = new Fuse(data, { keys: ['name'] });
            const results = fuse.search(value);
            const region = results.length > 0 ? results[0].item : 'euw1';
            config.twitch[channel].region = region;
            if (region === 'na1' || region === 'br1' || region === 'la1' || region === 'la2') config.twitch[channel].routing = 'americas';
            else if (region === 'jp1' || region === 'kr') config.twitch[channel].routing = 'asia';
            else if (region === 'eun1' || region === 'euw1' || region === 'tr1' || region === 'ru') config.twitch[channel].routing = 'europe';
            else if (region === 'oc1' || region === 'ph2' || region === 'sg2' || region === 'th2' || region === 'tw2' || region === 'vn2') config.twitch[channel].routing = 'sea';
          } else if (key === 'setlang') {
            const data = ['tr', 'en'];
            const fuse = new Fuse(data, { keys: ['name'] });
            const results = fuse.search(value);
            const language = results.length > 0 ? results[0].item : 'en';
            config.twitch[channel].lang = language;
          }
          else if (key === 'setsummoner') config.twitch[channel].summoner = value;
          fs.writeFileSync('config.json', JSON.stringify(config, null, 2), 'utf8');
          try {
            const response = await axios.get(`https://${config.twitch[channel].region}.api.riotgames.com/lol/summoner/v4/summoners/by-name/${config.twitch[channel].summoner}?api_key=${APIKEY}`);
            config.twitch[channel].summoner = response.data.name;
            reply(userstate.id, channel, config[config.twitch[channel].lang].Cache_Main.replace('{0}', response.data.name).replace('{1}', config.twitch[channel].region).replace('{2}', config[config.twitch[channel].lang].tag));
            fs.writeFileSync('config.json', JSON.stringify(config, null, 2), 'utf8');
          } catch (error) {
            console.error('ERROR:', error.response ? error.response.data : error.message);
            reply(userstate.id, channel, config[config.twitch[channel].lang].Cache_Error.replace('{0}', config.twitch[channel].summoner).replace('{1}', config.twitch[channel].region));
          }
        }
        else reply(userstate.id, channel, config[config.twitch[channel].lang].admin_error);
      } else {
        let { summoner: NAME } = config.twitch[channel];
        let ID, PUUID;
        try {
          const response = await axios.get(`https://${config.twitch[channel].region}.api.riotgames.com/lol/summoner/v4/summoners/by-name/${NAME}?api_key=${APIKEY}`);
          ({ name: NAME, id: ID, puuid: PUUID } = response.data);
        } catch (error) {
          ID = undefined, PUUID = undefined;
          reply(userstate.id, channel, config[config.twitch[channel].lang].Cache_Error.replace('{0}', NAME).replace('{1}', config.twitch[channel].region));
          return;
        }
        config.twitch[channel].lastcommand = key;
        fs.writeFileSync('config.json', JSON.stringify(config, null, 2), 'utf8');
        setTimeout(() => { if (config.twitch[channel].lastcommand === key) { config.twitch[channel].lastcommand = ' '; fs.writeFileSync('config.json', JSON.stringify(config, null, 2), 'utf8'); }; }, 12000);
        if (active === true) try { await axios.get(`https://${config.twitch[channel].region}.api.riotgames.com/lol/spectator/v4/active-games/by-summoner/${ID}?api_key=${APIKEY}`); } catch (error) { reply(userstate.id, channel, config[config.twitch[channel].lang].live_error); return; }
        if (key === 'tftitem') { const value = spaceIndex !== -1 ? message.substring(spaceIndex + 1) : ''; Global(userstate.id, channel, key, value, ID, PUUID); }
        else if (key === 'commands') { reply(userstate.id, channel, config[config.twitch[channel].lang].commands); }
        else Global(userstate.id, channel, key, NAME, ID, PUUID);
      }
    }
  });
});

async function Global(username, channel, key, NAME, ID, PUUID) {
  const { routing: ROUTING, region: REGION, lang: LANG } = config.twitch[channel];
  try {
    if (key.slice(3) === 'rank') {
      const info = key.slice(0, 3) === 'lol' ? (await axios.get(`https://${REGION}.api.riotgames.com/lol/league/v4/entries/by-summoner/${ID}?api_key=${APIKEY}`)).data.find(entry => entry.queueType === 'RANKED_SOLO_5x5') : (await axios.get(`https://${REGION}.api.riotgames.com/tft/league/v1/entries/by-summoner/${ID}?api_key=${APIKEY}`)).data.find(entry => entry.queueType === 'RANKED_TFT');
      reply(username, channel, info ? config[LANG].FRank_Main.replace('{0}', NAME).replace('{1}', config[LANG][`${info.tier} ${info.rank}`]).replace('{2}', info.leaguePoints) : config[LANG].FRank_Error.replace('{0}', NAME).replace('{1}', config[LANG].UNRANKED));
    } else if (key === 'tftavg') {
      const { data: matchIds } = await axios.get(`https://${ROUTING}.api.riotgames.com/tft/match/v1/matches/by-puuid/${PUUID}/ids?count=10&api_key=${APIKEY}`);
      const totalPlacement = (await Promise.all(matchIds.map(async matchId => (await axios.get(`https://${ROUTING}.api.riotgames.com/tft/match/v1/matches/${matchId}?api_key=${APIKEY}`)).data.info.participants.find(participant => participant.puuid === PUUID)?.placement || 0))).reduce((sum, placement) => sum + placement, 0);
      reply(username, channel, config[LANG].FTftavg_Main.replace('{0}', NAME).replace('{1}', matchIds.length).replace('{2}', Math.floor(totalPlacement / matchIds.length * 10) / 10));
    } else if (key === 'tftitem') {
      const data = await (await fetch(`https://raw.githubusercontent.com/ByDexterTR/RiotTwitchBot/main/tftitem_${LANG}.json`)).json();
      const fuse = new Fuse(data, { keys: ['name'] });
      const character = (fuse.search(NAME)[0] || {}).item;
      reply(username, channel, character ? config[LANG].FTftitem_Main.replace('{0}', character.name).replace('{1}', character.items.join(', ')) : config[LANG].unknown);
    } else if (key.slice(3) === 'lastmatch') {
      const matchDetails = key.slice(0, 3) === 'lol' ? (await axios.get(`https://${ROUTING}.api.riotgames.com/lol/match/v5/matches/by-puuid/${PUUID}/ids?api_key=${APIKEY}`)).data[0] : (await axios.get(`https://${ROUTING}.api.riotgames.com/tft/match/v1/matches/by-puuid/${PUUID}/ids?count=1&api_key=${APIKEY}`)).data[0];
      const myParticipant = key.slice(0, 3) === 'lol' ? (await axios.get(`https://${ROUTING}.api.riotgames.com/lol/match/v5/matches/${matchDetails}?api_key=${APIKEY}`)).data.info.participants.find(participant => participant.puuid === PUUID) : (await axios.get(`https://${ROUTING}.api.riotgames.com/tft/match/v1/matches/${matchDetails}?api_key=${APIKEY}`)).data.info.participants.find(participant => participant.puuid === PUUID);
      reply(username, channel, key.slice(0, 3) === 'lol' ? config[LANG].FLollastmatch_Main.replace('{0}', NAME).replace('{1}', myParticipant.championName).replace('{2}', myParticipant.deaths === 0 ? myParticipant.kills + myParticipant.assists : Math.floor(((myParticipant.kills + myParticipant.assists) / myParticipant.deaths) * 10) / 10).replace('{3}', config[LANG][myParticipant.individualPosition]).replace('{4}', config[LANG][myParticipant.win ? 'WIN' : 'LOSE']) : config[LANG].FTftlastmatch_Main.replace('{0}', NAME).replace('{1}', myParticipant.placement).replace('{2}', myParticipant.level));
    } else if (key === 'streak') {
      const { data } = await axios.get(`https://${ROUTING}.api.riotgames.com/lol/match/v5/matches/by-puuid/${PUUID}/ids?count=100&api_key=${APIKEY}`);
      let consecutiveWins = 0;
      for (const matchId of data) {
        const match = (await axios.get(`https://${ROUTING}.api.riotgames.com/lol/match/v5/matches/${matchId}?api_key=${APIKEY}`)).data;
        if (!match.info.participants.find(p => p.puuid === PUUID)?.win) break;
        consecutiveWins++;
      }
      reply(username, channel, consecutiveWins === 0 ? config[LANG].Flolstreak_Error.replace('{0}', NAME) : config[LANG].Flolstreak_Main.replace('{0}', NAME).replace('{1}', consecutiveWins));
    } else if (key === 'winrate') {
      const info = (await axios.get(`https://${REGION}.api.riotgames.com/lol/league/v4/entries/by-summoner/${ID}?api_key=${APIKEY}`)).data.find(entry => entry.queueType === 'RANKED_SOLO_5x5');
      reply(username, channel, info ? config[LANG].FLolwinrate_Main.replace('{0}', NAME).replace('{1}', info.wins).replace('{2}', info.losses).replace('{3}', Math.floor(((info.wins / (info.wins + info.losses)) * 100) * 100) / 100) : config[LANG].FLolwinrate_Error.replace('{0}', NAME).replace('{1}', config[LANG].error));
    } else if (key === 'mostplayed') {
      const { championId, championPoints } = (await axios.get(`https://${REGION}.api.riotgames.com/lol/champion-mastery/v4/champion-masteries/by-summoner/${ID}?api_key=${APIKEY}`)).data[0];
      reply(username, channel, config[LANG].FLolmostplayed_Main.replace('{0}', NAME).replace('{1}', await getChampionName(championId, LANG)).replace('{2}', formatMasteryPoints(championPoints)));
    } else if (key === 'level') {
      const levelData = (await axios.get(`https://${REGION}.api.riotgames.com/lol/summoner/v4/summoners/by-name/${NAME}?api_key=${APIKEY}`)).data;
      reply(username, channel, config[LANG].FLollevel_Main.replace('{0}', NAME).replace('{1}', levelData.summonerLevel));
    } else if (key === 'runes') {
      const { data } = await axios.get(`https://${REGION}.api.riotgames.com/lol/spectator/v4/active-games/by-summoner/${ID}?api_key=${APIKEY}`);
      const player = data.participants.find(player => player.summonerName === NAME);
      const perkIds = player.perks.perkIds.slice(0, 6);
      const versionData = await (await fetch(`https://ddragon.leagueoflegends.com/api/versions.json`)).json();
      const perkResponse = await axios.get(`http://ddragon.leagueoflegends.com/cdn/${versionData[0]}/data/${config[LANG].tag}/runesReforged.json`);
      const perkNames = perkIds.map(id => {
        for (const perkStyle of perkResponse.data) {
          for (const slot of perkStyle.slots) {
            const perk = slot.runes.find(rune => rune.id === id);
            if (perk) return perk.name;
          }
        }
        return config[LANG].unknown;
      });
      reply(username, channel, config[LANG].FLolrunes_Main.replace('{0}', await getChampionName(player.championId, LANG)).replace('{1}', perkNames.slice(0, 4).join(', ')).replace('{2}', perkNames.slice(4).join(', ')));
    } else if (key === 'matchup') {
      const { data } = await axios.get(`https://${REGION}.api.riotgames.com/lol/spectator/v4/active-games/by-summoner/${ID}?api_key=${APIKEY}`);
      const rankGroups = {};
      for (const participant of data.participants) {
        const info = (await axios.get(`https://${REGION}.api.riotgames.com/lol/league/v4/entries/by-summoner/${participant.summonerId}?api_key=${APIKEY}`)).data.find(entry => entry.queueType === 'RANKED_SOLO_5x5');
        const groupKey = info ? `${info.tier} ${info.rank}` : 'UNRANKED';
        rankGroups[groupKey] = (rankGroups[groupKey] || []).concat(await getChampionName(participant.championId, LANG));
      }
      reply(username, channel, Object.entries(rankGroups).sort((a, b) => config.ranks[a[0]] - config.ranks[b[0]]).map(([groupKey, champions]) => `${config[LANG][groupKey]} (${champions.join(', ')})`).join(' - '));
    } else if (key === 'elo') {
      const { data } = await axios.get(`https://${REGION}.api.riotgames.com/lol/spectator/v4/active-games/by-summoner/${ID}?api_key=${APIKEY}`);
      let totalRankValue = 0, totalPlayers = 0;
      for (const participant of data.participants) {
        const info = (await axios.get(`https://${REGION}.api.riotgames.com/lol/league/v4/entries/by-summoner/${participant.summonerId}?api_key=${APIKEY}`)).data.find(entry => entry.queueType === 'RANKED_SOLO_5x5');
        if (info) totalRankValue += config.ranks[`${info.tier} ${info.rank}`] || 0, totalPlayers++;
      }
      reply(username, channel, config[LANG].FLolavg_Main.replace('{0}', config[LANG][`${Object.keys(config.ranks).find(rank => config.ranks[rank] === Math.round(totalRankValue / totalPlayers))}`]));
    } else if (key === 'mastery' || key === 'levels') {
      const { data } = await axios.get(`https://${REGION}.api.riotgames.com/lol/spectator/v4/active-games/by-summoner/${ID}?api_key=${APIKEY}`);
      const sortedParticipants = data.participants.sort((a, b) => a.teamId - b.teamId);
      const teamMessages = {};
      for (const participant of sortedParticipants) {
        const { data } = key === 'mastery' ? await axios.get(`https://${REGION}.api.riotgames.com/lol/champion-mastery/v4/champion-masteries/by-summoner/${participant.summonerId}/by-champion/${participant.championId}?api_key=${APIKEY}`) : await axios.get(`https://${REGION}.api.riotgames.com/lol/summoner/v4/summoners/by-name/${participant.summonerName}?api_key=${APIKEY}`);
        teamMessages[participant.teamId] = teamMessages[participant.teamId] || [];
        teamMessages[participant.teamId].push(key === 'mastery' ? `${await getChampionName(participant.championId, LANG)} ${data.championPoints ? formatMasteryPoints(data.championPoints) : 0}` : `${await getChampionName(participant.championId, LANG)} ${data.summonerLevel}Lv`);
      }
      reply(username, channel, Object.values(teamMessages).map(team => team.join(', ')).join(' ∨S '));
    }
  } catch (error) {
    reply(username, channel, config[LANG].error);
    console.error('ERROR:', error.response ? error.response.data : error.message);
  }
}

async function getChampionName(championId, LANG) {
  try {
    const versionData = await (await fetch(`https://ddragon.leagueoflegends.com/api/versions.json`)).json();
    const championData = await (await fetch(`https://ddragon.leagueoflegends.com/cdn/${versionData[0]}/data/${config[LANG].tag}/champion.json`)).json();
    const champion = Object.values(championData.data).find(champion => champion.key === String(championId));
    return champion ? champion.name : config[LANG].unknown;
  } catch (error) {
    console.error('ERROR:', error.response ? error.response.data : error.message);
    return config[LANG].unknown;
  }
}

function formatMasteryPoints(points) {
  return points >= 1e6 ? (points / 1e6).toFixed(1) + 'M' : points >= 1e3 ? (points / 1e3).toFixed(0) + 'K' : points.toString();
}

function reply(replyParentMessageId, channel, message) {
  return client.raw(`@reply-parent-msg-id=${replyParentMessageId} PRIVMSG ${channel} :${message}`);
}