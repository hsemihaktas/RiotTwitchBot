const fs = require('fs');
const tmi = require('tmi.js');
const axios = require('axios');
const Fuse = require('fuse.js');

const config = JSON.parse(fs.readFileSync('config.json', 'utf8'));

const commands = [
  { cmd: '!commands,!help', key: 'help', active: false },

  { cmd: '!lolrank,!rank', key: 'rank', active: false },
  { cmd: '!lollastgame,!lastgame,!lg', key: 'lastgame', active: false },
  { cmd: '!winrate,!wr', key: 'wr', active: false },
  { cmd: '!streak', key: 'streak', active: false },
  { cmd: '!mostplayed,!main', key: 'main', active: false },
  { cmd: '!level,!lv', key: 'lv', active: false },
  { cmd: '!runes,!rune,!run', key: 'run', active: true },
  { cmd: '!matchup,!lolranks,!ranks', key: 'matchup', active: true },
  { cmd: '!avgrank,!elo', key: 'elo', active: true },
  { cmd: '!mastery', key: 'mastery', active: true },
  { cmd: '!levels', key: 'levels', active: true },

  { cmd: '!setregion,!setreg', key: 'setreg', active: undefined },
  { cmd: '!setsummoner,!setsum', key: 'setsum', active: undefined },
  { cmd: '!setlanguage,!setlang', key: 'setlang', active: undefined }
];

const APIKEY = config.apikey;

const client = new tmi.Client({ connection: { reconnect: true }, identity: { username: config.twitch.username, password: config.twitch.oauth, }, channels: config.twitch.channels });

client.connect();

client.on('connected', (address, port) => console.log(`${address}:${port}`));

client.on('message', async (channel, userstate, message, self) => {
  if (self || !message.startsWith('!')) return;

  let { lang: LANG, name: NAME, tagline: TAGLINE, id: ID, puuid: PUUID, region: REGION, routing: ROUTING, lastkey: LASTKEY } = config.twitch[channel];

  try {
    const info = (await axios.get(`https://${ROUTING === 'sea' ? 'asia' : ROUTING}.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${NAME}/${TAGLINE}?api_key=${APIKEY}`)).data;
    NAME = info.gameName;
    TAGLINE = info.tagLine;
    if (PUUID !== info.puuid) {
      config.twitch[channel].puuid = info.puuid;
      const data = (await axios.get(`https://${REGION}.api.riotgames.com/lol/summoner/v4/summoners/by-puuid/${info.puuid}?api_key=${APIKEY}`)).data;
      config.twitch[channel].id = data.id;
      PUUID = info.puuid;
      ID = data.id;
      fs.writeFileSync('config.json', JSON.stringify(config, null, 2), 'utf8');
    }
  } catch (error) {
    reply(userstate.id, channel, config[LANG].error_api);
    console.error('ERROR:', error.response ? error.response.data : error.message);
  }

  const spaceIndex = message.indexOf(' ');
  const command = spaceIndex !== -1 ? message.substring(0, spaceIndex) : message;

  commands.forEach(async ({ cmd, key, active }) => {
    if (LASTKEY === key || !cmd.split(',').includes(command)) return;
    if (active === undefined) {
      if (userstate.badges && (userstate.badges.moderator || userstate.badges.broadcaster)) {
        const value = spaceIndex !== -1 ? message.substring(spaceIndex + 1) : '';
        if (key === 'setreg') {
          const data = ['na1', 'br1', 'la1', 'la2', 'jp1', 'kr', 'eun1', 'euw1', 'tr1', 'ru', 'oc1', 'ph2', 'sg2', 'th2', 'tw2', 'vn2'];
          const fuse = new Fuse(data, { keys: ['name'] });
          const results = fuse.search(value);
          const region = results.length > 0 ? results[0].item : 'euw1';
          config.twitch[channel].region = region;
          if (region === 'na1' || region === 'br1' || region === 'la1' || region === 'la2') config.twitch[channel].routing = 'americas';
          else if (region === 'jp1' || region === 'kr') config.twitch[channel].routing = 'asia';
          else if (region === 'eun1' || region === 'euw1' || region === 'tr1' || region === 'ru') config.twitch[channel].routing = 'europe';
          else if (region === 'oc1' || region === 'ph2' || region === 'sg2' || region === 'th2' || region === 'tw2' || region === 'vn2') config.twitch[channel].routing = 'sea';
        } else if (key === 'setsum') {
          config.twitch[channel].name = value.split("#")[0];
          config.twitch[channel].tagline = value.split("#")[1];
        } else if (key === 'setlang') {
          const data = ['en', 'tr', 'de', 'es', 'it'];
          const fuse = new Fuse(data, { keys: ['name'] });
          const results = fuse.search(value);
          const language = results.length > 0 ? results[0].item : 'en';
          config.twitch[channel].lang = language;
        }
        fs.writeFileSync('config.json', JSON.stringify(config, null, 2), 'utf8');
        try {
          const info = (await axios.get(`https://${config.twitch[channel].routing === 'sea' ? 'asia' : config.twitch[channel].routing}.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${config.twitch[channel].name}/${config.twitch[channel].tagline}?api_key=${APIKEY}`)).data;
          config.twitch[channel].name = info.gameName;
          config.twitch[channel].tagline = info.tagLine;
          config.twitch[channel].puuid = info.puuid;
          const data = (await axios.get(`https://${config.twitch[channel].region}.api.riotgames.com/lol/summoner/v4/summoners/by-puuid/${info.puuid}?api_key=${APIKEY}`)).data;
          config.twitch[channel].id = data.id;
          fs.writeFileSync('config.json', JSON.stringify(config, null, 2), 'utf8');
          reply(userstate.id, channel, config[config.twitch[channel].lang].main_cache.replace('{0}', info.gameName).replace('{1}', info.tagLine).replace('{2}', config.twitch[channel].region).replace('{3}', config[config.twitch[channel].lang].tag));
        } catch (error) {
          reply(userstate.id, channel, config[config.twitch[channel].lang].error_cache.replace('{0}', info.gameName).replace('{1}', info.tagLine).replace('{2}', config.twitch[channel].region));
          console.error('ERROR:', error.response ? error.response.data : error.message);
        }
      }
      else reply(userstate.id, channel, config[config.twitch[channel].lang].admin_error);
    }
    if (active === true) { try { await axios.get(`https://${REGION}.api.riotgames.com/lol/spectator/v4/active-games/by-summoner/${ID}?api_key=${APIKEY}`); } catch (error) { reply(userstate.id, channel, config[LANG].error_live.replace('{0}', NAME).replace('{1}', TAGLINE)); return; } }
    try {
      if (key === 'rank') {
        const info = (await axios.get(`https://${REGION}.api.riotgames.com/lol/league/v4/entries/by-summoner/${ID}?api_key=${APIKEY}`)).data.find(entry => entry.queueType === 'RANKED_SOLO_5x5');
        reply(userstate.id, channel, info ? config[LANG].command_rank.replace('{0}', NAME).replace('{1}', TAGLINE).replace('{2}', config[LANG][`${info.tier} ${info.rank}`]).replace('{3}', info.leaguePoints) : config[LANG].error_rank.replace('{0}', NAME).replace('{1}', TAGLINE).replace('{2}', config[LANG].UNRANKED));
      } else if (key === 'lastgame') {
        const matchDetails = (await axios.get(`https://${ROUTING}.api.riotgames.com/lol/match/v5/matches/by-puuid/${PUUID}/ids?api_key=${APIKEY}`)).data[0];
        const myParticipant = (await axios.get(`https://${ROUTING}.api.riotgames.com/lol/match/v5/matches/${matchDetails}?api_key=${APIKEY}`)).data.info.participants.find(participant => participant.puuid === PUUID);
        reply(userstate.id, channel, config[LANG].command_lastgame.replace('{0}', NAME).replace('{1}', TAGLINE).replace('{2}', myParticipant.championName).replace('{3}', myParticipant.deaths === 0 ? myParticipant.kills + myParticipant.assists : Math.floor(((myParticipant.kills + myParticipant.assists) / myParticipant.deaths) * 10) / 10).replace('{4}', config[LANG][myParticipant.individualPosition]).replace('{5}', config[LANG][myParticipant.win ? 'WIN' : 'LOSE']));
      } else if (key === 'wr') {
        const info = (await axios.get(`https://${REGION}.api.riotgames.com/lol/league/v4/entries/by-summoner/${ID}?api_key=${APIKEY}`)).data.find(entry => entry.queueType === 'RANKED_SOLO_5x5');
        reply(userstate.id, channel, info ? config[LANG].command_wr.replace('{0}', NAME).replace('{1}', TAGLINE).replace('{2}', info.wins).replace('{3}', info.losses).replace('{4}', Math.floor(((info.wins / (info.wins + info.losses)) * 100) * 100) / 100) : config[LANG].error_wr.replace('{0}', NAME).replace('{1}', TAGLINE).replace('{2}', config[LANG].unknown));
      } else if (key === 'streak') {
        const { data } = await axios.get(`https://${ROUTING}.api.riotgames.com/lol/match/v5/matches/by-puuid/${PUUID}/ids?count=100&api_key=${APIKEY}`);
        let consecutiveWins = 0;
        for (const matchId of data) {
          const match = (await axios.get(`https://${ROUTING}.api.riotgames.com/lol/match/v5/matches/${matchId}?api_key=${APIKEY}`)).data;
          if (!match.info.participants.find(p => p.puuid === PUUID)?.win) break;
          consecutiveWins++;
        }
        reply(userstate.id, channel, consecutiveWins === 0 ? config[LANG].error_streak.replace('{0}', NAME).replace('{1}', TAGLINE) : config[LANG].command_streak.replace('{0}', NAME).replace('{1}', TAGLINE).replace('{2}', consecutiveWins));
      } else if (key === 'main') {
        const { championId, championPoints } = (await axios.get(`https://${REGION}.api.riotgames.com/lol/champion-mastery/v4/champion-masteries/by-summoner/${ID}?api_key=${APIKEY}`)).data[0];
        reply(userstate.id, channel, config[LANG].command_main.replace('{0}', NAME).replace('{1}', TAGLINE).replace('{2}', await getChampionName(championId, LANG)).replace('{3}', formatMasteryPoints(championPoints)));
      } else if (key === 'lv') {
        const levelData = (await axios.get(`https://${REGION}.api.riotgames.com/lol/summoner/v4/summoners/by-puuid/${PUUID}?api_key=${APIKEY}`)).data;
        reply(userstate.id, channel, config[LANG].command_lv.replace('{0}', NAME).replace('{1}', TAGLINE).replace('{2}', levelData.summonerLevel));
      } else if (key === 'run') {
        const { data } = await axios.get(`https://${REGION}.api.riotgames.com/lol/spectator/v4/active-games/by-summoner/${ID}?api_key=${APIKEY}`);
        const player = data.participants.find(player => player.summonerId === ID);
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
        reply(userstate.id, channel, config[LANG].command_run.replace('{0}', await getChampionName(player.championId, LANG)).replace('{1}', perkNames.slice(0, 4).join(', ')).replace('{2}', perkNames.slice(4).join(', ')));
      } else if (key === 'matchup') {
        const { data } = await axios.get(`https://${REGION}.api.riotgames.com/lol/spectator/v4/active-games/by-summoner/${ID}?api_key=${APIKEY}`);
        const rankGroups = {};
        for (const participant of data.participants) {
          const info = (await axios.get(`https://${REGION}.api.riotgames.com/lol/league/v4/entries/by-summoner/${participant.summonerId}?api_key=${APIKEY}`)).data.find(entry => entry.queueType === 'RANKED_SOLO_5x5');
          const groupKey = info ? `${info.tier} ${info.rank}` : 'UNRANKED';
          rankGroups[groupKey] = (rankGroups[groupKey] || []).concat(await getChampionName(participant.championId, LANG));
        }
        reply(userstate.id, channel, Object.entries(rankGroups).sort((a, b) => config.ranks[a[0]] - config.ranks[b[0]]).map(([groupKey, champions]) => `${config[LANG][groupKey]} (${champions.join(', ')})`).join(' - '));
      } else if (key === 'elo') {
        const { data } = await axios.get(`https://${REGION}.api.riotgames.com/lol/spectator/v4/active-games/by-summoner/${ID}?api_key=${APIKEY}`);
        let totalRankValue = 0, totalPlayers = 0;
        for (const participant of data.participants) {
          const info = (await axios.get(`https://${REGION}.api.riotgames.com/lol/league/v4/entries/by-summoner/${participant.summonerId}?api_key=${APIKEY}`)).data.find(entry => entry.queueType === 'RANKED_SOLO_5x5');
          if (info) totalRankValue += config.ranks[`${info.tier} ${info.rank}`] || 0, totalPlayers++;
        }
        reply(userstate.id, channel, config[LANG].command_elo.replace('{0}', config[LANG][`${Object.keys(config.ranks).find(rank => config.ranks[rank] === Math.round(totalRankValue / totalPlayers))}`]));
      } else if (key === 'mastery' || key === 'levels') {
        const { data } = await axios.get(`https://${REGION}.api.riotgames.com/lol/spectator/v4/active-games/by-summoner/${ID}?api_key=${APIKEY}`);
        const sortedParticipants = data.participants.sort((a, b) => a.teamId - b.teamId);
        const teamMessages = {};
        for (const participant of sortedParticipants) {
          const { data } = key === 'mastery' ? await axios.get(`https://${REGION}.api.riotgames.com/lol/champion-mastery/v4/champion-masteries/by-summoner/${participant.summonerId}/by-champion/${participant.championId}?api_key=${APIKEY}`) : await axios.get(`https://${REGION}.api.riotgames.com/lol/summoner/v4/summoners/by-name/${participant.summonerName}?api_key=${APIKEY}`);
          teamMessages[participant.teamId] = teamMessages[participant.teamId] || [];
          teamMessages[participant.teamId].push(key === 'mastery' ? `${await getChampionName(participant.championId, LANG)} ${data.championPoints ? formatMasteryPoints(data.championPoints) : 0}` : `${await getChampionName(participant.championId, LANG)} ${data.summonerLevel}Lv`);
        }
        reply(userstate.id, channel, Object.values(teamMessages).map(team => team.join(', ')).join(' ∨S '));
      }
    } catch (error) {
      reply(userstate.id, channel, config[LANG].error_api);
      console.error('ERROR:', error.response ? error.response.data : error.message);
    }
    if (key === 'help') {
      reply(userstate.id, channel, config[LANG].command_help);
    }
    config.twitch[channel].lastkey = key;
    fs.writeFileSync('config.json', JSON.stringify(config, null, 2), 'utf8');
    setTimeout(() => { if (config.twitch[channel].lastkey === key) { config.twitch[channel].lastkey = ' '; fs.writeFileSync('config.json', JSON.stringify(config, null, 2), 'utf8'); }; }, 500);
  });
});

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