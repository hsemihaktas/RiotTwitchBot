const fs = require('fs');
const tmi = require('tmi.js');
const axios = require('axios');
const Fuse = require('fuse.js');
const config = JSON.parse(fs.readFileSync('config.json', 'utf8'));

const APIKEY = config.apikey;

const client = new tmi.Client({
  connection: { reconnect: true },
  identity: {
    username: config.twitch.username,
    password: config.twitch.oauth,
  },
  channels: config.twitch.channels,
});

client.connect();

client.on('connected', (address, port) => {
  console.log(`${address}:${port}`);
});

client.on('message', async (channel, userstate, message, self) => {
  if (self || !message.startsWith('!')) return;
  const lastcommand = await config.twitch[channel].lastcommand;
  const LANG = await config.twitch[channel].lang;
  const REGION = await config.twitch[channel].region;
  const ROUTING = await config.twitch[channel].routing;
  let { summoner: NAME } = config.twitch[channel];
  let ID;
  let PUUID;
  try {
    const response = await axios.get(`https://${REGION}.api.riotgames.com/lol/summoner/v4/summoners/by-name/${NAME}?api_key=${APIKEY}`);
    ({ name: NAME, id: ID, puuid: PUUID } = response.data);
  } catch (error) {
    ID = undefined;
    PUUID = undefined;
  }
  const spaceIndex = message.indexOf(' ');
  const command = spaceIndex !== -1 ? message.substring(0, spaceIndex) : message;
  const value = spaceIndex !== -1 ? message.substring(spaceIndex + 1) : '';
  const commands = [
    { cmd: '!tftrank', key: 'tftrank', func: FTftrank, active: false },
    { cmd: '!tftlastmatch,!tftlastgame', key: 'tftlastmatch', func: FTftlastmatch, active: false },
    { cmd: '!tftavg', key: 'tftavg', func: FTftavg, active: false },
    { cmd: '!tftitem,!bis', key: 'tftitem', func: FTftitem, active: false },

    { cmd: '!lolrank', key: 'lolrank', func: FLolrank, active: false },
    { cmd: '!lollastmatch,!lollastgame', key: 'lollastmatch', func: FLollastmatch, active: false },
    { cmd: '!winrate,!wr', key: 'winrate', func: FLolwinrate, active: false },
    { cmd: '!streak', key: 'streak', func: Flolstreak, active: false },
    { cmd: '!mostplayed,!main', key: 'mostplayed', func: FLolmostplayed, active: false },
    { cmd: '!level', key: 'level', func: FLollevel, active: false },
    { cmd: '!runes,!rune,!run', key: 'runes', func: FLolrunes, active: true },
    { cmd: '!matchup,!lolranks', key: 'matchup', func: FLolmatchup, active: true },
    { cmd: '!avgrank,!elo', key: 'avgrank', func: FLolavg, active: true },
    { cmd: '!mastery', key: 'mastery', func: FLolmastery, active: true },
    { cmd: '!levels', key: 'levels', func: FLollevels, active: true },

    { cmd: '!commands,!help', key: 'commands', func: undefined, active: false },

    { cmd: '!setregion', key: 'setregion', func: undefined, active: undefined },
    { cmd: '!setsummoner', key: 'setsummoner', func: undefined, active: undefined },
    { cmd: '!setlang', key: 'setlang', func: undefined, active: undefined }
  ];
  commands.forEach(async ({ cmd, key, func, active }) => {
    if (lastcommand !== key && cmd.split(',').includes(command)) {
      if (active === undefined) {
        if (userstate.badges && (userstate.badges.moderator || userstate.badges.broadcaster)) {
          if (key === 'setregion') {
            const data = ['na1', 'br1', 'la1', 'la2', 'jp1', 'kr', 'eun1', 'euw1', 'tr1', 'ru', 'oc1', 'ph2', 'sg2', 'th2', 'tw2', 'vn2'];
            const fuse = new Fuse(data, { shouldSort: true, ignoreCase: true, keys: ['name'] });
            const results = fuse.search(value);
            const region = results.length > 0 ? results[0].item : 'euw1';
            config.twitch[channel].region = region;
            if (region === 'na1' || region === 'br1' || region === 'la1' || region === 'la2') config.twitch[channel].routing = 'americas';
            else if (region === 'jp1' || region === 'kr') config.twitch[channel].routing = 'asia';
            else if (region === 'eun1' || region === 'euw1' || region === 'tr1' || region === 'ru') config.twitch[channel].routing = 'europe';
            else if (region === 'oc1' || region === 'ph2' || region === 'sg2' || region === 'th2' || region === 'tw2' || region === 'vn2') config.twitch[channel].routing = 'sea';
          } else if (key === 'setlang') {
            const data = ['tr', 'en'];
            const fuse = new Fuse(data, { shouldSort: true, ignoreCase: true, keys: ['name'] });
            const results = fuse.search(value);
            const language = results.length > 0 ? results[0].item : 'en';
            config.twitch[channel].lang = language;
          }
          else if (key === 'setsummoner') config.twitch[channel].summoner = value;
          fs.writeFileSync('config.json', JSON.stringify(config, null, 2), 'utf8');
          try {
            const response = await axios.get(`https://${config.twitch[channel].region}.api.riotgames.com/lol/summoner/v4/summoners/by-name/${config.twitch[channel].summoner}?api_key=${APIKEY}`);
            config.twitch[channel].summoner = response.data.name;
            reply(userstate.id, channel, config[LANG].Cache_Main.replace('{0}', response.data.name).replace('{1}', config.twitch[channel].region).replace('{2}', config[LANG].tag));
            fs.writeFileSync('config.json', JSON.stringify(config, null, 2), 'utf8');
          } catch (error) {
            console.error('ERROR:', error.response ? error.response.data : error.message);
            reply(userstate.id, channel, config[LANG].Cache_Error.replace('{0}', NAME).replace('{1}', REGION));
          }
        }
        else reply(userstate.id, channel, config[LANG].onlyadmin);
      } else if (active === true) {
        config.twitch[channel].lastcommand = key;
        fs.writeFileSync('config.json', JSON.stringify(config, null, 2), 'utf8');
        setTimeout(() => { if (config.twitch[channel].lastcommand === key) { config.twitch[channel].lastcommand = ' '; fs.writeFileSync('config.json', JSON.stringify(config, null, 2), 'utf8'); }; }, 12000);
        if (NAME === undefined || ID === undefined || PUUID === undefined) { reply(userstate.id, channel, config[LANG].Cache_Error.replace('{0}', NAME).replace('{1}', REGION)); return; }
        try { await axios.get(`https://${REGION}.api.riotgames.com/lol/spectator/v4/active-games/by-summoner/${ID}?api_key=${APIKEY}`); func(channel, userstate.id, NAME, ID, PUUID, REGION, ROUTING, LANG); } catch (error) { reply(userstate.id, channel, config[LANG].live_error) }
      } else {
        config.twitch[channel].lastcommand = key;
        fs.writeFileSync('config.json', JSON.stringify(config, null, 2), 'utf8');
        setTimeout(() => { if (config.twitch[channel].lastcommand === key) { config.twitch[channel].lastcommand = ' '; fs.writeFileSync('config.json', JSON.stringify(config, null, 2), 'utf8'); }; }, 12000);
        if (NAME === undefined || ID === undefined || PUUID === undefined) { reply(userstate.id, channel, config[LANG].Cache_Error.replace('{0}', NAME).replace('{1}', REGION)); return; }
        if (key === 'commands') reply(userstate.id, channel, `LOL: !lolrank !lollastmatch !runes !matchup !wr !elo !mostplayed !streak !mastery !levels - TFT: !tftrank !tftlastmatch !tftavg !tftitem CHAMP - MOD: !setlang !setregion !setsummoner`);
        else if (key === 'tftitem' && value !== undefined) func(channel, value, userstate.id, NAME, ID, PUUID, REGION, ROUTING, LANG);
        else func(channel, userstate.id, NAME, ID, PUUID, REGION, ROUTING, LANG);
      }
    }
  });
});

//

async function FTftrank(channel, username, NAME, ID, _PUUID, REGION, _ROUTING, LANG) {
  try {
    const { data } = await axios.get(`https://${REGION}.api.riotgames.com/tft/league/v1/entries/by-summoner/${ID}?api_key=${APIKEY}`);
    if (ranked = data.find((entry) => entry.queueType === 'RANKED_TFT')) {
      const { tier, rank, leaguePoints } = ranked;
      const tr = `${tier} ${rank}`;
      reply(username, channel, `${NAME} » ${config[LANG][tr]} (${leaguePoints} LP)`);
    } else {
      reply(username, channel, `${NAME} » ${config[LANG].UNRANKED}`);
    }
  } catch (error) {
    reply(username, channel, config[LANG].rank_error);
    console.error('ERROR:', error.response ? error.response.data : error.message);
  }
}

async function FTftlastmatch(channel, username, NAME, _ID, PUUID, _REGION, ROUTING) {
  try {
    const matchList = await axios.get(`https://${ROUTING}.api.riotgames.com/tft/match/v1/matches/by-puuid/${PUUID}/ids?count=1&api_key=${APIKEY}`);
    const matchDetails = await axios.get(`https://${ROUTING}.api.riotgames.com/tft/match/v1/matches/${matchList.data[0]}?api_key=${APIKEY}`);
    const myParticipant = matchDetails.data.info.participants.find(participant => participant.puuid === PUUID);
    reply(username, channel, config[LANG].FTftlastmatch_Main.replace('{0}', NAME).replace('{1}', myParticipant.placement).replace('{2}', myParticipant.level));
  } catch (error) {
    reply(username, channel, config[LANG].match_error);
    console.error('ERROR:', error.response ? error.response.data : error.message);
  }
}

async function FTftavg(channel, username, NAME, _ID, PUUID, _REGION, ROUTING, LANG) {
  try {
    const { data } = await axios.get(`https://${ROUTING}.api.riotgames.com/tft/match/v1/matches/by-puuid/${PUUID}/ids?api_key=${APIKEY}`);
    let totalPlacement = 0;
    for (const matchId of data) {
      const matchDetails = await axios.get(`https://${ROUTING}.api.riotgames.com/tft/match/v1/matches/${matchId}?api_key=${APIKEY}`);
      totalPlacement += matchDetails.data.info.participants.find(participant => participant.puuid === PUUID)?.placement;
    }
    reply(username, channel, config[LANG].FTftavg_Main.replace('{0}', NAME).replace('{1}', data.length).replace('{2}', Math.floor(totalPlacement / data.length * 10) / 10));
  } catch (error) {
    reply(username, channel, config[LANG].match_error);
    console.error('ERROR:', error.response ? error.response.data : error.message);
  }
}

async function FTftitem(channel, message, username, _NAME, _ID, _PUUID, _REGION, _ROUTING, LANG) {
  try {
    const data = await (await fetch(`https://raw.githubusercontent.com/ByDexterTR/RiotTwitchBot/main/tftitem_${LANG}.json`)).json();
    const fuse = new Fuse(data, { shouldSort: true, ignoreCase: true, keys: ['name'] });
    const results = fuse.search(message);
    const character = results.length > 0 ? results[0].item : undefined;
    reply(username, channel, character ? config[LANG].FTftitem_Main.replace('{0}', character.name).replace('{1}', character.items.join(', ')) : config[LANG]['champion_error']);
  } catch (error) {
    reply(username, channel, config[LANG].FTftitem_Error);
    console.error('ERROR:', error.response ? error.response.data : error.message);
  }
}

async function FLolrank(channel, username, NAME, ID, _PUUID, REGION, _ROUTING, LANG) {
  try {
    const { data } = await axios.get(`https://${REGION}.api.riotgames.com/lol/league/v4/entries/by-summoner/${ID}?api_key=${APIKEY}`);
    if (ranked = data.find((entry) => entry.queueType === 'RANKED_SOLO_5x5')) {
      const { tier, rank, leaguePoints } = ranked;
      const tr = `${tier} ${rank}`;
      reply(username, channel, `${NAME} » ${config[LANG][tr]} (${leaguePoints} LP)`);
    } else {
      reply(username, channel, `${NAME} » ${config[LANG].UNRANKED}`);
    }
  } catch (error) {
    reply(username, channel, config[LANG].rank_error);
    console.error('ERROR:', error.response ? error.response.data : error.message);
  }
}

async function FLollastmatch(channel, username, NAME, _ID, PUUID, _REGION, ROUTING, LANG) {
  try {
    const matchList = await axios.get(`https://${ROUTING}.api.riotgames.com/lol/match/v5/matches/by-puuid/${PUUID}/ids?api_key=${APIKEY}`);
    const matchDetails = await axios.get(`https://${ROUTING}.api.riotgames.com/lol/match/v5/matches/${matchList.data[0]}?api_key=${APIKEY}`);
    const myParticipant = matchDetails.data.info.participants.find(participant => participant.puuid === PUUID);
    reply(username, channel, config[LANG].FLollastmatch_Main.replace('{0}', NAME).replace('{1}', myParticipant.championName).replace('{2}', Math.floor(((myParticipant.kills + myParticipant.assists) / myParticipant.deaths) * 10) / 10).replace('{3}', config[LANG][myParticipant.individualPosition]).replace('{4}', config[LANG][myParticipant.win ? 'WIN' : 'LOSE']))
  } catch (error) {
    reply(username, channel, config[LANG].match_error);
    console.error('ERROR:', error.response ? error.response.data : error.message);
  }
}

async function FLolwinrate(channel, username, NAME, ID, _PUUID, REGION, _ROUTING, LANG) {
  try {
    const { data } = await axios.get(`https://${REGION}.api.riotgames.com/lol/league/v4/entries/by-summoner/${ID}?api_key=${APIKEY}`);
    if (ranked = data.find((entry) => entry.queueType === 'RANKED_SOLO_5x5')) {
      const { wins, losses } = ranked;
      const winRate = (wins / (wins + losses)) * 100;
      reply(username, channel, config[LANG].FLolwinrate_Main.replace('{0}', NAME).replace('{1}', wins).replace('{2}', losses).replace('{3}', winRate.toFixed(2)));
    } else {
      reply(username, channel, config[LANG].FLolwinrate_Error.replace('{0}', NAME).replace('{1}', config[LANG]['match_error']));
    }
  } catch (error) {
    reply(username, channel, config[LANG].match_error);
    console.error('ERROR:', error.response ? error.response.data : error.message);
  }
}

async function Flolstreak(channel, username, NAME, _ID, PUUID, _REGION, ROUTING, LANG) {
  try {
    const { data } = await axios.get(`https://${ROUTING}.api.riotgames.com/lol/match/v5/matches/by-puuid/${PUUID}/ids?start=0&count=100&api_key=${APIKEY}`);
    let consecutiveWins = 0;
    for (const matchId of data) {
      const match = (await axios.get(`https://${ROUTING}.api.riotgames.com/lol/match/v5/matches/${matchId}?api_key=${APIKEY}`)).data;
      if (match.info.participants.find(p => p.puuid === PUUID)?.win) {
        consecutiveWins++;
      } else {
        break;
      }
    }
    reply(username, channel, consecutiveWins === 0 ? config[LANG].Flolstreak_Error.replace('{0}', NAME) : config[LANG]['Flolstreak_Main'].replace('{0}', NAME).replace('{1}', consecutiveWins));
  } catch (error) {
    reply(username, channel, config[LANG].match_error);
    console.error('ERROR:', error.response ? error.response.data : error.message);
  }
}

async function FLolmostplayed(channel, username, NAME, ID, _PUUID, REGION, _ROUTING, LANG) {
  try {
    const { data: [{ championId, championPoints }] } = await axios.get(`https://${REGION}.api.riotgames.com/lol/champion-mastery/v4/champion-masteries/by-summoner/${ID}?api_key=${APIKEY}`);
    reply(username, channel, `${NAME} » ${await getChampionName(championId, LANG)} (${formatMasteryPoints(championPoints)})`);
  } catch (error) {
    reply(username, channel, config[LANG].champion_error);
    console.error('ERROR:', error.response ? error.response.data : error.message);
  }
}

async function FLollevel(channel, username, NAME, _ID, _PUUID, REGION, _ROUTING, LANG) {
  try {
    const { data: levelData } = await axios.get(`https://${REGION}.api.riotgames.com/lol/summoner/v4/summoners/by-name/${NAME}?api_key=${APIKEY}`);
    reply(username, channel, `${NAME} » ${levelData.summonerLevel}Lv`);
  } catch (error) {
    reply(username, channel, config[LANG].match_error);
    console.error('ERROR:', error.response ? error.response.data : error.message);
  }
}

async function FLolrunes(channel, username, NAME, ID, _PUUID, REGION, _ROUTING, LANG) {
  try {
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
      return config[LANG].FLolrunes_Rune;
    });
    reply(username, channel, `${await getChampionName(player.championId, LANG)} » ${perkNames.slice(0, 4).join(', ')} - ${perkNames.slice(4).join(', ')}`);
  } catch (error) {
    reply(username, channel, config[LANG].FLolrunes_Error);
    console.error('ERROR:', error.response ? error.response.data : error.message);
  }
}

async function FLolmatchup(channel, username, _NAME, ID, _PUUID, REGION, _ROUTING, LANG) {
  try {
    const { data } = await axios.get(`https://${REGION}.api.riotgames.com/lol/spectator/v4/active-games/by-summoner/${ID}?api_key=${APIKEY}`);
    const rankGroups = {};
    for (const participant of data.participants) {
      const leagueInfo = (await axios.get(`https://${REGION}.api.riotgames.com/lol/league/v4/entries/by-summoner/${participant.summonerId}?api_key=${APIKEY}`)).data.find(entry => entry.queueType === 'RANKED_SOLO_5x5');
      const groupKey = leagueInfo ? `${leagueInfo.tier} ${leagueInfo.rank}` : 'UNRANKED';
      rankGroups[groupKey] = rankGroups[groupKey] || [];
      rankGroups[groupKey].push(await getChampionName(participant.championId, LANG));
    }
    reply(username, channel, Object.entries(rankGroups).sort((a, b) => ranks[a[0]] - ranks[b[0]]).map(([groupKey, champions]) => `${config[LANG][groupKey]} (${champions.join(', ')})`).join(' - '));
  } catch (error) {
    reply(username, channel, config[LANG].rank_error);
    console.error('ERROR:', error.response ? error.response.data : error.message);
  }
}

async function FLolavg(channel, username, _NAME, ID, _PUUID, REGION, _ROUTING, LANG) {
  try {
    const { data } = await axios.get(`https://${REGION}.api.riotgames.com/lol/spectator/v4/active-games/by-summoner/${ID}?api_key=${APIKEY}`);
    let totalRankValue = 0;
    let totalPlayers = 0;
    for (const participant of data.participants) {
      const { data: leagueData } = await axios.get(`https://${REGION}.api.riotgames.com/lol/league/v4/entries/by-summoner/${participant.summonerId}?api_key=${APIKEY}`);
      const leagueInfo = leagueData.find((entry) => entry.queueType === 'RANKED_SOLO_5x5');
      if (leagueInfo) {
        const { tier, rank } = leagueInfo;
        const rankValue = ranks[`${tier} ${rank}`] || 0;
        totalRankValue += rankValue;
        totalPlayers++;
      }
    }
    reply(username, channel, config[LANG].FLolavg_Main.replace('{0}', config[LANG][`${Object.keys(ranks).find(rank => ranks[rank] === Math.round(totalRankValue / totalPlayers))}`]));
  } catch (error) {
    reply(username, channel, config[LANG].rank_error);
    console.error('ERROR:', error.response ? error.response.data : error.message);
  }
}

async function FLolmastery(channel, username, _NAME, ID, _PUUID, REGION, _ROUTING, LANG) {
  try {
    const { data } = await axios.get(`https://${REGION}.api.riotgames.com/lol/spectator/v4/active-games/by-summoner/${ID}?api_key=${APIKEY}`);
    const sortedParticipants = data.participants.sort((a, b) => a.teamId - b.teamId);
    const teamMessages = {};
    for (const participant of sortedParticipants) {
      const { data: masteryData } = await axios.get(`https://${REGION}.api.riotgames.com/lol/champion-mastery/v4/champion-masteries/by-summoner/${participant.summonerId}?api_key=${APIKEY}`);
      const championMastery = masteryData.find(entry => entry.championId === participant.championId);
      teamMessages[participant.teamId] = teamMessages[participant.teamId] || [];
      teamMessages[participant.teamId].push(`${await getChampionName(participant.championId, LANG)} ${championMastery ? formatMasteryPoints(championMastery.championPoints) : 0}`);
    }
    reply(username, channel, Object.values(teamMessages).map(team => team.join(', ')).join(' ∨S '));
  } catch (error) {
    reply(username, channel, config[LANG].champion_error);
    console.error('ERROR:', error.response ? error.response.data : error.message);
  }
}

async function FLollevels(channel, username, _NAME, ID, _PUUID, REGION, _ROUTING, LANG) {
  try {
    const { data } = await axios.get(`https://${REGION}.api.riotgames.com/lol/spectator/v4/active-games/by-summoner/${ID}?api_key=${APIKEY}`);
    const sortedParticipants = data.participants.sort((a, b) => a.teamId - b.teamId);
    const teamMessages = {};
    for (const participant of sortedParticipants) {
      const { data: levelData } = await axios.get(`https://${REGION}.api.riotgames.com/lol/summoner/v4/summoners/by-name/${participant.summonerName}?api_key=${APIKEY}`);
      teamMessages[participant.teamId] = teamMessages[participant.teamId] || [];
      teamMessages[participant.teamId].push(`${await getChampionName(participant.championId, LANG)} ${levelData.summonerLevel}Lv`);
    }
    reply(username, channel, Object.values(teamMessages).map(team => team.join(', ')).join(' ∨S '));
  } catch (error) {
    reply(username, channel, config[LANG].champion_error);
    console.error('ERROR:', error.response ? error.response.data : error.message);
  }
}

//

const ranks = { 'UNRANKED': 0, 'IRON IV': 1, 'IRON III': 2, 'IRON II': 3, 'IRON I': 4, 'BRONZE IV': 5, 'BRONZE III': 6, 'BRONZE II': 7, 'BRONZE I': 8, 'SILVER IV': 9, 'SILVER III': 10, 'SILVER II': 11, 'SILVER I': 12, 'GOLD IV': 13, 'GOLD III': 14, 'GOLD II': 15, 'GOLD I': 16, 'PLATINUM IV': 17, 'PLATINUM III': 18, 'PLATINUM II': 19, 'PLATINUM I': 20, 'EMERALD IV': 21, 'EMERALD III': 22, 'EMERALD II': 23, 'EMERALD I': 24, 'DIAMOND IV': 25, 'DIAMOND III': 26, 'DIAMOND II': 27, 'DIAMOND I': 28, 'MASTER I': 29, 'GRANDMASTER I': 30, 'CHALLENGER I': 31 };

async function getChampionName(championId, LANG) {
  try {
    const versionData = await (await fetch(`https://ddragon.leagueoflegends.com/api/versions.json`)).json();
    const championData = await (await fetch(`https://ddragon.leagueoflegends.com/cdn/${versionData[0]}/data/${config[LANG].tag}/champion.json`)).json();
    const champion = Object.values(championData.data).find(champion => champion.key === String(championId));
    return champion ? champion.name : config[LANG].champion_error;
  } catch (error) {
    console.error('ERROR:', error.response ? error.response.data : error.message);
    return config[LANG].champion_error;
  }
}

function formatMasteryPoints(points) {
  return points >= 1e6 ? (points / 1e6).toFixed(1) + 'M' : points >= 1e3 ? (points / 1e3).toFixed(0) + 'K' : points.toString();
}

function reply(replyParentMessageId, channel, message) {
  return client.raw(`@reply-parent-msg-id=${replyParentMessageId} PRIVMSG ${channel} :${message}`);
}