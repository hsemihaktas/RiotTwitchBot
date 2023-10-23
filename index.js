const tmi = require('tmi.js');
const axios = require('axios');
const Fuse = require('fuse.js');

const RIOT_API_KEY = 'RGAPI-KEY';

let TFT_SUMMONER_NAME = 'SUMMONER NAME';
let TFT_REGION = 'TR | EUW';
let TFT_SUMMONER_ID;
let TFT_SUMMONER_PUUID;

let LOL_SUMMONER_NAME = 'SUMMONER NAME';
let LOL_REGION = 'TR | EUW';
let LOL_SUMMONER_ID;
let LOL_SUMMONER_PUUID;

let lastcommand;
let boolen = false;

const opts = {
  identity: {
    username: 'TWITCH BOT USERNAME',
    password: 'TWITCH BOT oauth:TOKEN',
  },
  channels: ['TWITCH CHANNEL NAME'],
};

const client = new tmi.client(opts);

client.connect();

client.on('connected', async (address, port) => {
  console.log(`Bot başarıyla Twitch sunucusuna bağlandı: ${address}:${port}`);
  Precache('tft', undefined, undefined);
  Precache('lol', undefined, undefined);
});

client.on('message', async (channel, userstate, message, self) => {
  if (self || boolen || !message.startsWith('!')) return;
  const spaceIndex = message.indexOf(' ');
  const command = spaceIndex !== -1 ? message.substring(0, spaceIndex) : message;
  const value = spaceIndex !== -1 ? message.substring(spaceIndex + 1) : '';
  if (userstate.badges && (userstate.badges.moderator || userstate.badges.broadcaster)) {
    if (command === '!tftsummoner') {
      TFT_SUMMONER_NAME = value;
      Precache('tft', userstate.id, channel);
    } else if (command === '!tftregion') {
      TFT_REGION = value;
      Precache('tft', userstate.id, channel);
    } else if (command === '!lolsummoner') {
      LOL_SUMMONER_NAME = value;
      Precache('lol', userstate.id, channel);
    } else if (command === '!lolregion') {
      LOL_REGION = value;
      Precache('lol', userstate.id, channel);
    }
  }
  const commands = [
    { cmd: '!tftrank', key: 'tftrank', func: FTftrank }, { cmd: '!tftlastmatch,!tftlastgame', key: 'tftlastmatch', func: FTftlastmatch }, { cmd: '!tftavg', key: 'tftavg', func: FTftavg }, { cmd: '!tftitem,!bis', key: 'tftitem', func: FTftitem }, { cmd: '!tftmeta', key: 'tftmeta', func: undefined },
    { cmd: '!lolrank', key: 'lolrank', func: FLolrank }, { cmd: '!lollastmatch,!lollastgame', key: 'lollastmatch', func: FLollastmatch }, { cmd: '!runes', key: 'runes', func: FLolrunes }, { cmd: '!matchup', key: 'matchup', func: FLolmatchup }, { cmd: '!winrate,!wr', key: 'winrate', func: FLolwinrate }, { cmd: '!avgrank,!elo', key: 'avgrank', func: FLolavg }, { cmd: '!mostplayed', key: 'mostplayed', func: FLolmostplayed }, { cmd: '!streak', key: 'streak', func: Flolstreak }, { cmd: '!mastery', key: 'mastery', func: FLolmastery }, { cmd: '!levels', key: 'levels', func: FLollevels },
    { cmd: '!commands,!help', key: 'commands', func: undefined }
  ];
  commands.forEach(({ cmd, key, func }) => {
    if (lastcommand !== key && cmd.split(',').includes(command)) {
      SetDelay(key);
      if ((TFT_SUMMONER_ID === undefined || TFT_SUMMONER_PUUID === undefined) && (key === 'tftrank' || key === 'tftlastmatch' || key === 'tftavg' || key === 'tftitem')) reply(userstate.id, channel, `TFT sihirdarı ayarlı değil, modlara veya yayıncıya !tftsummoner & !tftregion komutlarıyla ayarlamasını isteyin.`);
      else if ((LOL_SUMMONER_ID === undefined || LOL_SUMMONER_PUUID === undefined) && (key === 'lolrank' || key === 'lollastmatch' || key === 'runes' || key === 'matchup' || key === 'winrate' || key === 'avgrank' || key === 'mostplayed' || key === 'streak' || key === 'mastery' || key === 'levels')) reply(userstate.id, channel, `LOL sihirdarı ayarlı değil, modlara veya yayıncıya !lolsummoner & !lolregion komutlarıyla ayarlamasını isteyin.`);
      else if (key === 'tftitem' && value !== undefined) func(channel, value, userstate.id);
      else if (key == 'tftmeta') reply(userstate.id, channel, `Mahir 4 • Demacia 3 » Ortalama: 3.2 | WR: 26.1% | İlk 4: 74.1%`);
      else if (key === 'commands') reply(userstate.id, channel, `LOL: !lolrank !lollastmatch !runes !matchup !winrate !avgrank !mostplayed !streak !mastery !levels • TFT: !tftrank !tftlastmatch !tftavg !tftitem Karakter !tftmeta`);
      else func(channel, userstate.id);
    }
  });
});

// TFT Rank
async function FTftrank(channel, username) {
  try {
    const { data } = await axios.get(`https://${TFT_REGION}1.api.riotgames.com/tft/league/v1/entries/by-summoner/${TFT_SUMMONER_ID}?api_key=${RIOT_API_KEY}`);
    if (ranked = data.find((entry) => entry.queueType === 'RANKED_TFT')) {
      const { tier, rank, leaguePoints } = ranked;
      reply(username, channel, ` ${TFT_SUMMONER_NAME} » ${`${tier} ${rank} (${leaguePoints} LP)`.replace(/(MASTER|GRANDMASTER|CHALLENGER) I/g, '$1').replace(new RegExp(Object.keys(translate).join('|'), 'gi'), (match) => translate[match])}`);
    } else {
      reply(username, channel, `${TFT_SUMMONER_NAME} » Derecesiz`);
    }
  } catch (error) {
    reply(username, channel, `Lig verileri alınamadı veya derecesiz.`);
    console.error('Hata oluştu:', error.response ? error.response.data : error.message);
  }
}

// TFT Last Match
async function FTftlastmatch(channel, username) {
  try {
    const matchList = await axios.get(`https://europe.api.riotgames.com/tft/match/v1/matches/by-puuid/${TFT_SUMMONER_PUUID}/ids?count=1&api_key=${RIOT_API_KEY}`);
    const matchDetails = await axios.get(`https://europe.api.riotgames.com/tft/match/v1/matches/${matchList.data[0]}?api_key=${RIOT_API_KEY}`);
    const myParticipant = matchDetails.data.info.participants.find(participant => participant.puuid === TFT_SUMMONER_PUUID);
    reply(username, channel, `${TFT_SUMMONER_NAME} » ${myParticipant.placement}. sıra | ${myParticipant.level}. seviye`);
  } catch (error) {
    reply(username, channel, `Maç geçmişi alınamadı.`);
    console.error('Hata oluştu:', error.response ? error.response.data : error.message);
  }
}

// TFT Average Placement
async function FTftavg(channel, username) {
  try {
    const { data } = await axios.get(`https://europe.api.riotgames.com/tft/match/v1/matches/by-puuid/${TFT_SUMMONER_PUUID}/ids?api_key=${RIOT_API_KEY}`);
    let totalPlacement = 0;
    for (const matchId of data) {
      const matchDetails = await axios.get(`https://europe.api.riotgames.com/tft/match/v1/matches/${matchId}?api_key=${RIOT_API_KEY}`);
      totalPlacement += matchDetails.data.info.participants.find(participant => participant.puuid === TFT_SUMMONER_PUUID)?.placement;
    }
    reply(username, channel, `${TFT_SUMMONER_NAME} » ${data.length} maç | Ortalama ${Math.floor(totalPlacement / data.length * 10) / 10}`);
  } catch (error) {
    reply(username, channel, `Maç geçmişi alınamadı.`);
    console.error('Hata oluştu:', error.response ? error.response.data : error.message);
  }
}

// TFT Item Build
async function FTftitem(channel, message, username) {
  try {
    const data = await (await fetch('https://raw.githubusercontent.com/ByDexterTR/RiotTwitchBot/main/node_modules/champions_data.json')).json();
    const fuse = new Fuse(data, { shouldSort: true, ignoreCase: true, keys: ['name'], });
    const results = fuse.search(message);
    const character = results.length > 0 ? results[0].item : undefined;
    reply(username, channel, character ? `(Set 9.5) ${character.name} » ${character.items.join(', ')}` : `Karakter bulunamadı.`);
  } catch (error) {
    reply(username, channel, `Eşya dizilimleri alınamadı.`);
    console.error('Hata oluştu:', error.response ? error.response.data : error.message);
  }
}

// LOL Rank
async function FLolrank(channel, username) {
  try {
    const { data } = await axios.get(`https://${LOL_REGION}1.api.riotgames.com/lol/league/v4/entries/by-summoner/${LOL_SUMMONER_ID}?api_key=${RIOT_API_KEY}`);
    if (ranked = data.find((entry) => entry.queueType === 'RANKED_SOLO_5x5')) {
      const { tier, rank, leaguePoints } = ranked;
      reply(username, channel, ` ${LOL_SUMMONER_NAME} » ${`${tier} ${rank} (${leaguePoints} LP)`.replace(/(MASTER|GRANDMASTER|CHALLENGER) I/g, '$1').replace(new RegExp(Object.keys(translate).join('|'), 'gi'), (match) => translate[match])}`);
    } else {
      reply(username, channel, `${LOL_SUMMONER_NAME} » Derecesiz`);
    }
  } catch (error) {
    reply(username, channel, `Lig verileri alınamadı veya derecesiz.`);
    console.error('Hata oluştu:', error.response ? error.response.data : error.message);
  }
}

// LOL Last Match
async function FLollastmatch(channel, username) {
  try {
    const matchList = await axios.get(`https://europe.api.riotgames.com/lol/match/v5/matches/by-puuid/${LOL_SUMMONER_PUUID}/ids?api_key=${RIOT_API_KEY}`);
    const matchDetails = await axios.get(`https://europe.api.riotgames.com/lol/match/v5/matches/${matchList.data[0]}?api_key=${RIOT_API_KEY}`);
    const myParticipant = matchDetails.data.info.participants.find(participant => participant.puuid === LOL_SUMMONER_PUUID);
    reply(username, channel, `${myParticipant.summonerName} » ${myParticipant.championName} (${myParticipant.kills}/${myParticipant.deaths}/${myParticipant.assists}) | ${myParticipant.win ? 'Zafer' : 'Bozgun'}`)
  } catch (error) {
    reply(username, channel, `Maç geçmişi alınamadı.`);
    console.error('Hata oluştu:', error.response ? error.response.data : error.message);
  }
}

// LOL Runes
async function FLolrunes(channel, username) {
  try {
    const { data } = await axios.get(`https://${LOL_REGION}1.api.riotgames.com/lol/spectator/v4/active-games/by-summoner/${LOL_SUMMONER_ID}?api_key=${RIOT_API_KEY}`);
    const player = data.participants.find(player => player.summonerName === LOL_SUMMONER_NAME);
    const perkIds = player.perks.perkIds.slice(0, 6);
    const versionData = await (await fetch(`https://ddragon.leagueoflegends.com/api/versions.json`)).json();
    const perkResponse = await axios.get(`http://ddragon.leagueoflegends.com/cdn/${versionData[0]}/data/tr_TR/runesReforged.json`);
    const perkNames = perkIds.map(id => {
      for (const perkStyle of perkResponse.data) {
        for (const slot of perkStyle.slots) {
          const perk = slot.runes.find(rune => rune.id === id);
          if (perk) return perk.name;
        }
      }
      return 'Bilinmeyen Rün';
    });
    reply(username, channel, `${await getChampionName(player.championId)} » ${perkNames.slice(0, 4).join(', ')} | ${perkNames.slice(4).join(', ')}`);
  } catch (error) {
    reply(username, channel, `Rün verileri alınamadı veya oyuncu maçta değil.`);
    console.error('Hata oluştu:', error.response ? error.response.data : error.message);
  }
}

// LOL Summoners Rank
async function FLolmatchup(channel, username) {
  try {
    const { data } = await axios.get(`https://${LOL_REGION}1.api.riotgames.com/lol/spectator/v4/active-games/by-summoner/${LOL_SUMMONER_ID}?api_key=${RIOT_API_KEY}`);
    const rankGroups = {};
    for (const participant of data.participants) {
      const leagueInfo = (await axios.get(`https://${LOL_REGION}1.api.riotgames.com/lol/league/v4/entries/by-summoner/${participant.summonerId}?api_key=${RIOT_API_KEY}`)).data.find(entry => entry.queueType === 'RANKED_SOLO_5x5');
      const groupKey = leagueInfo ? `${leagueInfo.tier} ${leagueInfo.rank}` : 'UNRANKED';
      rankGroups[groupKey] = rankGroups[groupKey] || [];
      rankGroups[groupKey].push(await getChampionName(participant.championId));
    }
    const sortedOutput = Object.entries(rankGroups).sort((a, b) => ranks[a[0]] - ranks[b[0]]).map(([groupKey, champions]) => `${groupKey} (${champions.join(', ')})`).join(' • ');
    reply(username, channel, `${sortedOutput.replace(/(MASTER|GRANDMASTER|CHALLENGER) I/g, '$1').replace(new RegExp(Object.keys(translate).join('|'), 'gi'), (match) => translate[match])}`);
  } catch (error) {
    reply(username, channel, `Lig verileri alınamadı veya oyuncu maçta değil.`);
    console.error('Hata oluştu:', error.response ? error.response.data : error.message);
  }
}

// LOL Win Rate
async function FLolwinrate(channel, username) {
  try {
    const { data } = await axios.get(`https://${LOL_REGION}1.api.riotgames.com/lol/league/v4/entries/by-summoner/${LOL_SUMMONER_ID}?api_key=${RIOT_API_KEY}`);
    if (ranked = data.find((entry) => entry.queueType === 'RANKED_SOLO_5x5')) {
      const { wins, losses } = ranked;
      const winRate = (wins / (wins + losses)) * 100;
      reply(username, channel, `${LOL_SUMMONER_NAME} » SoloQ: ${wins}W ${losses}L ${winRate.toFixed(2)}%`);
    } else {
      reply(username, channel, `${LOL_SUMMONER_NAME} » SoloQ maç geçmişi bulunamadı.`);
    }
  } catch (error) {
    reply(username, channel, `Maç geçmişi alınamadı.`);
    console.error('Hata oluştu:', error.response ? error.response.data : error.message);
  }
}

// LOL Summoners Average Rank
async function FLolavg(channel, username) {
  try {
    const { data } = await axios.get(`https://${LOL_REGION}1.api.riotgames.com/lol/spectator/v4/active-games/by-summoner/${LOL_SUMMONER_ID}?api_key=${RIOT_API_KEY}`);
    let totalRankValue = 0;
    let totalPlayers = 0;
    for (const participant of data.participants) {
      const { data: leagueData } = await axios.get(`https://${LOL_REGION}1.api.riotgames.com/lol/league/v4/entries/by-summoner/${participant.summonerId}?api_key=${RIOT_API_KEY}`);
      const leagueInfo = leagueData.find((entry) => entry.queueType === 'RANKED_SOLO_5x5');
      if (leagueInfo) {
        const { tier, rank } = leagueInfo;
        const rankValue = ranks[`${tier} ${rank}`] || 0;
        totalRankValue += rankValue;
        totalPlayers++;
      }
    }
    let averageRankName = Object.keys(ranks).find(rank => ranks[rank] === Math.round(totalRankValue / totalPlayers)) || 'Bilinmeyen Rank';
    reply(username, channel, `Lig ortalaması » ${averageRankName.replace(/(MASTER|GRANDMASTER|CHALLENGER) I/g, '$1').replace(new RegExp(Object.keys(translate).join('|'), 'gi'), (match) => translate[match])}`);
  } catch (error) {
    reply(username, channel, `Lig verileri alınamadı veya oyuncu maçta değil.`);
    console.error('Hata oluştu:', error.response ? error.response.data : error.message);
  }
}

// LOL Most Played Champion
async function FLolmostplayed(channel, username) {
  try {
    const { data: [{ championId, championPoints }] } = await axios.get(`https://${LOL_REGION}1.api.riotgames.com/lol/champion-mastery/v4/champion-masteries/by-summoner/${LOL_SUMMONER_ID}?api_key=${RIOT_API_KEY}`);
    reply(username, channel, `${LOL_SUMMONER_NAME} » ${await getChampionName(championId)} (${formatMasteryPoints(championPoints)})`);
  } catch (error) {
    reply(username, channel, `Şampiyon verileri alınamadı.`);
    console.error('Hata oluştu:', error.response ? error.response.data : error.message);
  }
}

// LOL Win Streak
async function Flolstreak(channel, username) {
  try {
    const { data } = await axios.get(`https://europe.api.riotgames.com/lol/match/v5/matches/by-puuid/${LOL_SUMMONER_PUUID}/ids?start=0&count=100&api_key=${RIOT_API_KEY}`);
    let consecutiveWins = 0;
    for (const matchId of data) {
      const match = (await axios.get(`https://europe.api.riotgames.com/lol/match/v5/matches/${matchId}?api_key=${RIOT_API_KEY}`)).data;
      if (match.info.participants.find(p => p.puuid === LOL_SUMMONER_PUUID)?.win) {
        consecutiveWins++;
      } else {
        break;
      }
    }
    reply(username, channel, consecutiveWins === 0 ? `${LOL_SUMMONER_NAME} » Yenilmezlik serisi bulunamadı.` : `${LOL_SUMMONER_NAME} » ${consecutiveWins} maçtır yenilmiyor.`);
  } catch (error) {
    reply(username, channel, `Maç geçmişi alınamadı.`);
    console.error('Hata oluştu:', error.response ? error.response.data : error.message);
  }
}

// LOL Summoners Champion Mastery
async function FLolmastery(channel, username) {
  try {
    const { data } = await axios.get(`https://${LOL_REGION}1.api.riotgames.com/lol/spectator/v4/active-games/by-summoner/${LOL_SUMMONER_ID}?api_key=${RIOT_API_KEY}`);
    const sortedParticipants = data.participants.sort((a, b) => a.teamId - b.teamId);
    const teamMessages = {};
    for (const participant of sortedParticipants) {
      const championId = participant.championId;
      const { data: masteryData } = await axios.get(`https://${LOL_REGION}1.api.riotgames.com/lol/champion-mastery/v4/champion-masteries/by-summoner/${participant.summonerId}?api_key=${RIOT_API_KEY}`);
      const championMastery = masteryData.find(entry => entry.championId === championId);
      teamMessages[participant.teamId] = teamMessages[participant.teamId] || [];
      teamMessages[participant.teamId].push(`${await getChampionName(championId)} ${championMastery ? formatMasteryPoints(championMastery.championPoints) : 0}`);
    }
    const message = Object.values(teamMessages).map(team => team.join(', ')).join(' ∨S ');
    reply(username, channel, message);
  } catch (error) {
    reply(username, channel, `Ustalık puanları alınamadı veya oyuncu maçta değil.`);
    console.error('Hata oluştu:', error.response ? error.response.data : error.message);
  }
}

// LOL Summoners Level
async function FLollevels(channel, username) {
  try {
    const { data } = await axios.get(`https://${LOL_REGION}1.api.riotgames.com/lol/spectator/v4/active-games/by-summoner/${LOL_SUMMONER_ID}?api_key=${RIOT_API_KEY}`);
    const sortedParticipants = data.participants.sort((a, b) => a.teamId - b.teamId);
    const teamMessages = {};
    for (const participant of sortedParticipants) {
      const championId = participant.championId;
      const { data: levelData } = await axios.get(`https://${LOL_REGION}1.api.riotgames.com/lol/summoner/v4/summoners/by-name/${participant.summonerName}?api_key=${RIOT_API_KEY}`);
      const summonerLevel = levelData.summonerLevel;
      teamMessages[participant.teamId] = teamMessages[participant.teamId] || [];
      teamMessages[participant.teamId].push(`${await getChampionName(championId)} ${summonerLevel}Lv`);
    }
    const message = Object.values(teamMessages).map(team => team.join(', ')).join(' ∨S ');
    reply(username, channel, message);
  } catch (error) {
    reply(username, channel, `Seviyeler alınamadı veya oyuncu maçta değil.`);
    console.error('Hata oluştu:', error.response ? error.response.data : error.message);
  }
}

// STOCK
const translate = { 'UNRANKED': 'Derecesiz', 'IRON': 'Demir', 'BRONZE': 'Bronz', 'SILVER': 'Gümüş', 'GOLD': 'Altın', 'PLATINUM': 'Platin', 'EMERALD': 'Zümrüt', 'DIAMOND': 'Elmas', 'MASTER': 'Ustalık', 'GRANDMASTER': 'Üstatlık', 'CHALLENGER': 'Şampiyonluk' };
const ranks = { 'UNRANKED': 0, 'IRON IV': 1, 'IRON III': 2, 'IRON II': 3, 'IRON I': 4, 'BRONZE IV': 5, 'BRONZE III': 6, 'BRONZE II': 7, 'BRONZE I': 8, 'SILVER IV': 9, 'SILVER III': 10, 'SILVER II': 11, 'SILVER I': 12, 'GOLD IV': 13, 'GOLD III': 14, 'GOLD II': 15, 'GOLD I': 16, 'PLATINUM IV': 17, 'PLATINUM III': 18, 'PLATINUM II': 19, 'PLATINUM I': 20, 'EMERALD IV': 21, 'EMERALD III': 22, 'EMERALD II': 23, 'EMERALD I': 24, 'DIAMOND IV': 25, 'DIAMOND III': 26, 'DIAMOND II': 27, 'DIAMOND I': 28, 'MASTER I': 29, 'GRANDMASTER I': 30, 'CHALLENGER I': 31 };

async function Precache(game, username, channel) {
  if (game === 'tft') {
    try {
      const tftresponse = await axios.get(`https://${TFT_REGION}1.api.riotgames.com/tft/summoner/v1/summoners/by-name/${TFT_SUMMONER_NAME}?api_key=${RIOT_API_KEY}`);
      TFT_SUMMONER_NAME = tftresponse.data.name;
      TFT_SUMMONER_ID = tftresponse.data.id;
      TFT_SUMMONER_PUUID = tftresponse.data.puuid;
      if (username !== undefined) reply(username, channel, `TFT sihirdarı ayarlandı, ${TFT_SUMMONER_NAME}(${TFT_REGION})`);
      else console.log(`TFT sihirdarı ayarlandı, ${TFT_SUMMONER_NAME}(${TFT_REGION})`);
    } catch (error) {
      if (username !== undefined) reply(username, channel, `${TFT_SUMMONER_NAME}(${TFT_REGION}) sihirdarı bulunamadı, !tftregion & !tftsummoner ile ayarlayın.`);
      else console.log(`${TFT_SUMMONER_NAME}(${TFT_REGION}) sihirdarı bulunamadı, !tftregion & !tftsummoner ile ayarlayın.`);
      console.error('Hata oluştu:', error.response ? error.response.data : error.message);
      TFT_SUMMONER_ID = undefined;
      TFT_SUMMONER_PUUID = undefined;
    }
  } else {
    try {
      const lolresponse = await axios.get(`https://${LOL_REGION}1.api.riotgames.com/lol/summoner/v4/summoners/by-name/${LOL_SUMMONER_NAME}?api_key=${RIOT_API_KEY}`);
      LOL_SUMMONER_NAME = lolresponse.data.name;
      LOL_SUMMONER_ID = lolresponse.data.id;
      LOL_SUMMONER_PUUID = lolresponse.data.puuid;
      if (username !== undefined) reply(username, channel, `LOL sihirdarı ayarlandı, ${LOL_SUMMONER_NAME}(${LOL_REGION})`);
      else console.log(`LOL sihirdarı ayarlandı, ${LOL_SUMMONER_NAME}(${LOL_REGION})`);
    } catch (error) {
      if (username !== undefined) reply(username, channel, `${LOL_SUMMONER_NAME}(${LOL_REGION}) sihirdarı bulunamadı, !lolregion & !lolsummoner ile ayarlayın.`);
      else console.log(`${LOL_SUMMONER_NAME}(${LOL_REGION}) sihirdarı bulunamadı, !lolregion & !lolsummoner ile ayarlayın.`);
      console.error('Hata oluştu:', error.response ? error.response.data : error.message);
      LOL_SUMMONER_ID = undefined;
      LOL_SUMMONER_PUUID = undefined;
    }
  }
}

async function getChampionName(championId) {
  try {
    const versionData = await (await fetch(`https://ddragon.leagueoflegends.com/api/versions.json`)).json();
    const championData = await (await fetch(`https://ddragon.leagueoflegends.com/cdn/${versionData[0]}/data/tr_TR/champion.json`)).json();
    const champion = Object.values(championData.data).find(champion => champion.key === String(championId));
    return champion ? champion.name : 'Bilinmeyen Karakter';
  } catch (error) {
    console.error('Karakter ismi çekilirken hata:', error.message);
    return 'Bilinmeyen Karakter';
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