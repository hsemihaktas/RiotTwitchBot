const fs = require('fs');
const tmi = require('tmi.js');
const axios = require('axios');
const Fuse = require('fuse.js');
const config = JSON.parse(fs.readFileSync('config.json', 'utf8'));

let LANG;

let APIKEY;

let NAME;
let ID;
let PUUID;

let REGION;
let ROUTING;

let lastcommand;
let boolen = false;

const opts = {
  identity: {
    username: 'BOT NAME',
    password: 'oauth:TOKEN',
  },
  channels: ['CHANNEL NAME'],
};

const client = new tmi.client(opts);

client.connect();

client.on('connected', async (address, port) => {
  LANG = await config['lang'];
  console.log(config[LANG]['twitch'].replace('{0}', address).replace('{1}', port));
  Cache(undefined, undefined);
});

client.on('message', async (channel, userstate, message, self) => {
  if (self || boolen || !message.startsWith('!')) return;
  const spaceIndex = message.indexOf(' ');
  const command = spaceIndex !== -1 ? message.substring(0, spaceIndex) : message;
  const value = spaceIndex !== -1 ? message.substring(spaceIndex + 1) : '';
  let live = true;
  try { await axios.get(`https://${REGION}.api.riotgames.com/lol/spectator/v4/active-games/by-summoner/${ID}?api_key=${APIKEY}`); } catch (error) { live = false; }
  const commands = [
    { cmd: '!tftrank', key: 'tftrank', func: FTftrank, active: false },
    { cmd: '!tftlastmatch,!tftlastgame', key: 'tftlastmatch', func: FTftlastmatch, active: false },
    { cmd: '!tftavg', key: 'tftavg', func: FTftavg, active: false },
    { cmd: '!tftitem,!bis', key: 'tftitem', func: FTftitem, active: false },

    { cmd: '!lolrank', key: 'lolrank', func: FLolrank, active: false },
    { cmd: '!lollastmatch,!lollastgame', key: 'lollastmatch', func: FLollastmatch, active: false },
    { cmd: '!winrate,!wr', key: 'winrate', func: FLolwinrate, active: false },
    { cmd: '!streak', key: 'streak', func: Flolstreak, active: false },
    { cmd: '!mostplayed', key: 'mostplayed', func: FLolmostplayed, active: false },
    { cmd: '!runes,!rune', key: 'runes', func: FLolrunes, active: true },
    { cmd: '!matchup', key: 'matchup', func: FLolmatchup, active: true },
    { cmd: '!avgrank,!elo', key: 'avgrank', func: FLolavg, active: true },
    { cmd: '!mastery', key: 'mastery', func: FLolmastery, active: true },
    { cmd: '!levels', key: 'levels', func: FLollevels, active: true },

    { cmd: '!commands,!help', key: 'commands', func: undefined, active: false },

    { cmd: '!setregion', key: 'setregion', func: undefined, active: undefined },
    { cmd: '!setsummoner', key: 'setsummoner', func: undefined, active: undefined },
    { cmd: '!setlang', key: 'setlang', func: undefined, active: undefined }
  ];
  commands.forEach(({ cmd, key, func, active }) => {
    if (lastcommand !== key && cmd.split(',').includes(command)) {
      SetDelay(key);
      if (active === undefined) {
        if (userstate.badges && (userstate.badges.moderator || userstate.badges.broadcaster)) {
          if (key === 'setregion') {
            const data = ['na1', 'br1', 'la1', 'la2', 'jp1', 'kr', 'eun1', 'euw1', 'tr1', 'ru', 'oc1', 'ph2', 'sg2', 'th2', 'tw2', 'vn2'];
            const fuse = new Fuse(data, { shouldSort: true, ignoreCase: true, keys: ['name'], });
            const results = fuse.search(value);
            const region = results.length > 0 ? results[0].item : 'euw1';
            config.riot.region = region;
            if (region === 'na1' || region === 'br1' || region === 'la1' || region === 'la2') config.riot.routing = 'americas';
            else if (region === 'jp1' || region === 'kr') config.riot.routing = 'asia';
            else if (region === 'eun1' || region === 'euw1' || region === 'tr1' || region === 'ru') config.riot.routing = 'europe';
            else if (region === 'oc1' || region === 'ph2' || region === 'sg2' || region === 'th2' || region === 'tw2' || region === 'vn2') config.riot.routing = 'sea';
          } else if (key === 'setlang') {
            const data = ['tr', 'en'];
            const fuse = new Fuse(data, { shouldSort: true, ignoreCase: true, keys: ['name'], });
            const results = fuse.search(value);
            const language = results.length > 0 ? results[0].item : 'en';
            config.lang = language;
          }
          else if (key === 'setsummoner') config.riot.summoner = value;
          fs.writeFileSync('config.json', JSON.stringify(config, null, 2), 'utf8');
          Cache(userstate.id, channel);
          SetDelay(undefined);
        }
        else reply(userstate.id, channel, config[LANG]['onlyadmin']);
      } else if (active === true) {
        if (NAME === undefined || ID === undefined || PUUID === undefined) { reply(userstate.id, channel, config[LANG]['Cache_Error'].replace('{0}', NAME).replace('{1}', REGION)); return; }
        if (live === false) reply(userstate.id, channel, config[LANG]['live_error']);
        else func(channel, userstate.id);
      } else {
        if (NAME === undefined || ID === undefined || PUUID === undefined) { reply(userstate.id, channel, config[LANG]['Cache_Error'].replace('{0}', NAME).replace('{1}', REGION)); return; }
        if (key === 'commands') reply(userstate.id, channel, `LOL: !lolrank !lollastmatch !runes !matchup !wr !elo !mostplayed !streak !mastery !levels - TFT: !tftrank !tftlastmatch !tftavg !tftitem CHAMP - MOD: !setlang !setregion !setsummoner`);
        else if (key === 'tftitem' && value !== undefined) func(channel, value, userstate.id);
        else func(channel, userstate.id);
      }
    }
  });
});

//

async function FTftrank(channel, username) {
  try {
    const { data } = await axios.get(`https://${REGION}.api.riotgames.com/tft/league/v1/entries/by-summoner/${ID}?api_key=${APIKEY}`);
    if (ranked = data.find((entry) => entry.queueType === 'RANKED_TFT')) {
      const { tier, rank, leaguePoints } = ranked;
      const tr = `${tier} ${rank}`;
      reply(username, channel, `${NAME} » ${config[LANG][tr]} (${leaguePoints} LP)`);
    } else {
      reply(username, channel, `${NAME} » ${config[LANG]['UNRANKED']}`);
    }
  } catch (error) {
    reply(username, channel, config[LANG]['rank_error']);
    console.error('ERROR:', error.response ? error.response.data : error.message);
  }
}

async function FTftlastmatch(channel, username) {
  try {
    const matchList = await axios.get(`https://${ROUTING}.api.riotgames.com/tft/match/v1/matches/by-puuid/${PUUID}/ids?count=1&api_key=${APIKEY}`);
    const matchDetails = await axios.get(`https://${ROUTING}.api.riotgames.com/tft/match/v1/matches/${matchList.data[0]}?api_key=${APIKEY}`);
    const myParticipant = matchDetails.data.info.participants.find(participant => participant.puuid === PUUID);
    reply(username, channel, config[LANG]['FTftlastmatch_Main'].replace('{0}', NAME).replace('{1}', myParticipant.placement).replace('{2}', myParticipant.level));
  } catch (error) {
    reply(username, channel, config[LANG]['match_error']);
    console.error('ERROR:', error.response ? error.response.data : error.message);
  }
}

async function FTftavg(channel, username) {
  try {
    const { data } = await axios.get(`https://${ROUTING}.api.riotgames.com/tft/match/v1/matches/by-puuid/${PUUID}/ids?api_key=${APIKEY}`);
    let totalPlacement = 0;
    for (const matchId of data) {
      const matchDetails = await axios.get(`https://${ROUTING}.api.riotgames.com/tft/match/v1/matches/${matchId}?api_key=${APIKEY}`);
      totalPlacement += matchDetails.data.info.participants.find(participant => participant.puuid === PUUID)?.placement;
    }
    reply(username, channel, config[LANG]['FTftavg_Main'].replace('{0}', NAME).replace('{1}', data.length).replace('{2}', Math.floor(totalPlacement / data.length * 10) / 10));
  } catch (error) {
    reply(username, channel, config[LANG]['match_error']);
    console.error('ERROR:', error.response ? error.response.data : error.message);
  }
}

async function FTftitem(channel, message, username) {
  try {
    const data = await (await fetch(`https://raw.githubusercontent.com/ByDexterTR/RiotTwitchBot/main/tftitem_${LANG}.json`)).json();
    const fuse = new Fuse(data, { shouldSort: true, ignoreCase: true, keys: ['name'], });
    const results = fuse.search(message);
    const character = results.length > 0 ? results[0].item : undefined;
    reply(username, channel, character ? config[LANG]['FTftitem_Main'].replace('{0}', character.name).replace('{1}', character.items.join(', ')) : config[LANG]['champion_error']);
  } catch (error) {
    reply(username, channel, config[LANG]['FTftitem_Error']);
    console.error('ERROR:', error.response ? error.response.data : error.message);
  }
}

async function FLolrank(channel, username) {
  try {
    const { data } = await axios.get(`https://${REGION}.api.riotgames.com/lol/league/v4/entries/by-summoner/${ID}?api_key=${APIKEY}`);
    if (ranked = data.find((entry) => entry.queueType === 'RANKED_SOLO_5x5')) {
      const { tier, rank, leaguePoints } = ranked;
      const tr = `${tier} ${rank}`;
      reply(username, channel, `${NAME} » ${config[LANG][tr]} (${leaguePoints} LP)`);
    } else {
      reply(username, channel, `${NAME} » ${config[LANG]['UNRANKED']}`);
    }
  } catch (error) {
    reply(username, channel, config[LANG]['rank_error']);
    console.error('ERROR:', error.response ? error.response.data : error.message);
  }
}

async function FLollastmatch(channel, username) {
  try {
    const matchList = await axios.get(`https://${ROUTING}.api.riotgames.com/lol/match/v5/matches/by-puuid/${PUUID}/ids?api_key=${APIKEY}`);
    const matchDetails = await axios.get(`https://${ROUTING}.api.riotgames.com/lol/match/v5/matches/${matchList.data[0]}?api_key=${APIKEY}`);
    const myParticipant = matchDetails.data.info.participants.find(participant => participant.puuid === PUUID);
    reply(username, channel, config[LANG]['FLollastmatch_Main'].replace('{0}', NAME).replace('{1}', myParticipant.championName).replace('{2}', Math.floor(((myParticipant.kills + myParticipant.assists) / myParticipant.deaths) * 10) / 10).replace('{3}', config[LANG][myParticipant.individualPosition]).replace('{4}', config[LANG][myParticipant.win ? 'WIN' : 'LOSE']))
  } catch (error) {
    reply(username, channel, config[LANG]['match_error']);
    console.error('ERROR:', error.response ? error.response.data : error.message);
  }
}

async function FLolwinrate(channel, username) {
  try {
    const { data } = await axios.get(`https://${REGION}.api.riotgames.com/lol/league/v4/entries/by-summoner/${ID}?api_key=${APIKEY}`);
    if (ranked = data.find((entry) => entry.queueType === 'RANKED_SOLO_5x5')) {
      const { wins, losses } = ranked;
      const winRate = (wins / (wins + losses)) * 100;
      reply(username, channel, config[LANG]['FLolwinrate_Main'].replace('{0}', NAME).replace('{1}', wins).replace('{2}', losses).replace('{3}', winRate.toFixed(2)));
    } else {
      reply(username, channel, config[LANG]['FLolwinrate_Error'].replace('{0}', NAME).replace('{1}', config[LANG]['match_error']));
    }
  } catch (error) {
    reply(username, channel, config[LANG]['match_error']);
    console.error('ERROR:', error.response ? error.response.data : error.message);
  }
}

async function Flolstreak(channel, username) {
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
    reply(username, channel, consecutiveWins === 0 ? config[LANG]['Flolstreak_Error'].replace('{0}', NAME) : config[LANG]['Flolstreak_Main'].replace('{0}', NAME).replace('{1}', consecutiveWins));
  } catch (error) {
    reply(username, channel, config[LANG]['match_error']);
    console.error('ERROR:', error.response ? error.response.data : error.message);
  }
}

async function FLolmostplayed(channel, username) {
  try {
    const { data: [{ championId, championPoints }] } = await axios.get(`https://${REGION}.api.riotgames.com/lol/champion-mastery/v4/champion-masteries/by-summoner/${ID}?api_key=${APIKEY}`);
    reply(username, channel, `${NAME} » ${await getChampionName(championId)} (${formatMasteryPoints(championPoints)})`);
  } catch (error) {
    reply(username, channel, config[LANG]['champion_error']);
    console.error('ERROR:', error.response ? error.response.data : error.message);
  }
}

async function FLolrunes(channel, username) {
  try {
    const { data } = await axios.get(`https://${REGION}.api.riotgames.com/lol/spectator/v4/active-games/by-summoner/${ID}?api_key=${APIKEY}`);
    const player = data.participants.find(player => player.summonerName === NAME);
    const perkIds = player.perks.perkIds.slice(0, 6);
    const versionData = await (await fetch(`https://ddragon.leagueoflegends.com/api/versions.json`)).json();
    const perkResponse = await axios.get(`http://ddragon.leagueoflegends.com/cdn/${versionData[0]}/data/${config[LANG]['tag']}/runesReforged.json`);
    const perkNames = perkIds.map(id => {
      for (const perkStyle of perkResponse.data) {
        for (const slot of perkStyle.slots) {
          const perk = slot.runes.find(rune => rune.id === id);
          if (perk) return perk.name;
        }
      }
      return config[LANG]['FLolrunes_Rune'];
    });
    reply(username, channel, `${await getChampionName(player.championId)} » ${perkNames.slice(0, 4).join(', ')} - ${perkNames.slice(4).join(', ')}`);
  } catch (error) {
    reply(username, channel, config[LANG]['FLolrunes_Error']);
    console.error('ERROR:', error.response ? error.response.data : error.message);
  }
}

async function FLolmatchup(channel, username) {
  try {
    const { data } = await axios.get(`https://${REGION}.api.riotgames.com/lol/spectator/v4/active-games/by-summoner/${ID}?api_key=${APIKEY}`);
    const rankGroups = {};
    for (const participant of data.participants) {
      const leagueInfo = (await axios.get(`https://${REGION}.api.riotgames.com/lol/league/v4/entries/by-summoner/${participant.summonerId}?api_key=${APIKEY}`)).data.find(entry => entry.queueType === 'RANKED_SOLO_5x5');
      const groupKey = leagueInfo ? `${leagueInfo.tier} ${leagueInfo.rank}` : 'UNRANKED';
      rankGroups[groupKey] = rankGroups[groupKey] || [];
      rankGroups[groupKey].push(await getChampionName(participant.championId));
    }
    reply(username, channel, Object.entries(rankGroups).sort((a, b) => ranks[a[0]] - ranks[b[0]]).map(([groupKey, champions]) => `${config[LANG][groupKey]} (${champions.join(', ')})`).join(' - '));
  } catch (error) {
    reply(username, channel, config[LANG]['rank_error']);
    console.error('ERROR:', error.response ? error.response.data : error.message);
  }
}

async function FLolavg(channel, username) {
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
    reply(username, channel, config[LANG]['FLolavg_Main'].replace('{0}', config[LANG][`${Object.keys(ranks).find(rank => ranks[rank] === Math.round(totalRankValue / totalPlayers))}`]));
  } catch (error) {
    reply(username, channel, config[LANG]['rank_error']);
    console.error('ERROR:', error.response ? error.response.data : error.message);
  }
}

async function FLolmastery(channel, username) {
  try {
    const { data } = await axios.get(`https://${REGION}.api.riotgames.com/lol/spectator/v4/active-games/by-summoner/${ID}?api_key=${APIKEY}`);
    const sortedParticipants = data.participants.sort((a, b) => a.teamId - b.teamId);
    const teamMessages = {};
    for (const participant of sortedParticipants) {
      const championId = participant.championId;
      const { data: masteryData } = await axios.get(`https://${REGION}.api.riotgames.com/lol/champion-mastery/v4/champion-masteries/by-summoner/${participant.summonerId}?api_key=${APIKEY}`);
      const championMastery = masteryData.find(entry => entry.championId === championId);
      teamMessages[participant.teamId] = teamMessages[participant.teamId] || [];
      teamMessages[participant.teamId].push(`${await getChampionName(championId)} ${championMastery ? formatMasteryPoints(championMastery.championPoints) : 0}`);
    }
    const message = Object.values(teamMessages).map(team => team.join(', ')).join(' ∨S ');
    reply(username, channel, message);
  } catch (error) {
    reply(username, channel, config[LANG]['champion_error']);
    console.error('ERROR:', error.response ? error.response.data : error.message);
  }
}

async function FLollevels(channel, username) {
  try {
    const { data } = await axios.get(`https://${REGION}.api.riotgames.com/lol/spectator/v4/active-games/by-summoner/${ID}?api_key=${APIKEY}`);
    const sortedParticipants = data.participants.sort((a, b) => a.teamId - b.teamId);
    const teamMessages = {};
    for (const participant of sortedParticipants) {
      const championId = participant.championId;
      const { data: levelData } = await axios.get(`https://${REGION}.api.riotgames.com/lol/summoner/v4/summoners/by-name/${participant.summonerName}?api_key=${APIKEY}`);
      const summonerLevel = levelData.summonerLevel;
      teamMessages[participant.teamId] = teamMessages[participant.teamId] || [];
      teamMessages[participant.teamId].push(`${await getChampionName(championId)} ${summonerLevel}Lv`);
    }
    const message = Object.values(teamMessages).map(team => team.join(', ')).join(' ∨S ');
    reply(username, channel, message);
  } catch (error) {
    reply(username, channel, config[LANG]['champion_error']);
    console.error('ERROR:', error.response ? error.response.data : error.message);
  }
}

//

const ranks = { 'UNRANKED': 0, 'IRON IV': 1, 'IRON III': 2, 'IRON II': 3, 'IRON I': 4, 'BRONZE IV': 5, 'BRONZE III': 6, 'BRONZE II': 7, 'BRONZE I': 8, 'SILVER IV': 9, 'SILVER III': 10, 'SILVER II': 11, 'SILVER I': 12, 'GOLD IV': 13, 'GOLD III': 14, 'GOLD II': 15, 'GOLD I': 16, 'PLATINUM IV': 17, 'PLATINUM III': 18, 'PLATINUM II': 19, 'PLATINUM I': 20, 'EMERALD IV': 21, 'EMERALD III': 22, 'EMERALD II': 23, 'EMERALD I': 24, 'DIAMOND IV': 25, 'DIAMOND III': 26, 'DIAMOND II': 27, 'DIAMOND I': 28, 'MASTER I': 29, 'GRANDMASTER I': 30, 'CHALLENGER I': 31 };

async function Cache(username, channel) {
  LANG = await config['lang'];
  APIKEY = await config['riot']['apikey'];
  REGION = await config['riot']['region'];
  ROUTING = await config['riot']['routing'];
  NAME = await config['riot']['summoner'];
  try {
    const response = await axios.get(`https://${REGION}.api.riotgames.com/lol/summoner/v4/summoners/by-name/${NAME}?api_key=${APIKEY}`);
    NAME = response.data.name;
    ID = response.data.id;
    PUUID = response.data.puuid;
    if (username !== undefined) reply(username, channel, config[LANG]['Cache_Main'].replace('{0}', NAME).replace('{1}', REGION).replace('{2}', config[LANG]['tag']));
    else console.log(config[LANG]['Cache_Main'].replace('{0}', NAME).replace('{1}', REGION).replace('{2}', config[LANG]['tag']));
  } catch (error) {
    ID = undefined;
    PUUID = undefined;
    console.error('ERROR:', error.response ? error.response.data : error.message);
    if (username !== undefined) reply(username, channel, config[LANG]['Cache_Error'].replace('{0}', NAME).replace('{1}', REGION));
    else console.log(config[LANG]['Cache_Error2'].replace('{0}', NAME).replace('{1}', REGION));
  }
}

async function getChampionName(championId) {
  try {
    const versionData = await (await fetch(`https://ddragon.leagueoflegends.com/api/versions.json`)).json();
    const championData = await (await fetch(`https://ddragon.leagueoflegends.com/cdn/${versionData[0]}/data/${config[LANG]['tag']}/champion.json`)).json();
    const champion = Object.values(championData.data).find(champion => champion.key === String(championId));
    return champion ? champion.name : config[LANG]['champion_error'];
  } catch (error) {
    console.error('ERROR:', error.response ? error.response.data : error.message);
    return config[LANG]['champion_error'];
  }
}

function SetDelay(command) {
  boolen = true;
  setTimeout(() => { boolen = false; }, 2000);
  lastcommand = command;
  setTimeout(() => { if (lastcommand === command) { lastcommand = '' }; }, 12000);
}

function formatMasteryPoints(points) {
  return points >= 1e6 ? (points / 1e6).toFixed(1) + 'M' : points >= 1e3 ? (points / 1e3).toFixed(0) + 'K' : points.toString();
}

function reply(replyParentMessageId, channel, message) {
  return client.raw(`@reply-parent-msg-id=${replyParentMessageId} PRIVMSG ${channel} :${message}`);
}