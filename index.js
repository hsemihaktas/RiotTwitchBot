const tmi = require("tmi.js");
const axios = require("axios");

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
    username: "TWITCH BOT USERNAME",
    password: "TWITCH BOT oauth:TOKEN",
  },
  channels: ["TWITCH CHANNEL NAME"],
};

const client = new tmi.client(opts);

client.connect();

client.on("connected", async (address, port) => {
  console.log(`Bot başarıyla Twitch sunucusuna bağlandı: ${address}:${port}`);
  try {
    const tftresponse = await axios.get(`https://${TFT_REGION}1.api.riotgames.com/tft/summoner/v1/summoners/by-name/${TFT_SUMMONER_NAME}?api_key=${RIOT_API_KEY}`);
    TFT_SUMMONER_NAME = tftresponse.data.name;
    TFT_SUMMONER_ID = tftresponse.data.id;
    TFT_SUMMONER_PUUID = tftresponse.data.puuid;
  } catch (error) {
    console.error('Hata oluştu:', error.response ? error.response.data : error.message);
  }
  try {
    const lolresponse = await axios.get(`https://${LOL_REGION}1.api.riotgames.com/lol/summoner/v4/summoners/by-name/${LOL_SUMMONER_NAME}?api_key=${RIOT_API_KEY}`);
    LOL_SUMMONER_NAME = lolresponse.data.name;
    LOL_SUMMONER_ID = lolresponse.data.id;
    LOL_SUMMONER_PUUID = lolresponse.data.puuid;
  } catch (error) {
    console.error('Hata oluştu:', error.response ? error.response.data : error.message);
  }
});

client.on("message", async (channel, userstate, message, self) => {
  if (self || boolen || !message.startsWith('!')) return;

  const args = message.split(" ");
  const command = args[0].toLowerCase();
  args.shift();

  const badges = userstate.badges;
  if (badges && (badges.moderator || badges.broadcaster) && args.length > 0) {
    if (command === "!tftsummoner") {
      try {
        const nickname = args.join(" ");
        const response = await axios.get(`https://${TFT_REGION}1.api.riotgames.com/tft/summoner/v1/summoners/by-name/${nickname}?api_key=${RIOT_API_KEY}`);
        TFT_SUMMONER_NAME = response.data.name;
        TFT_SUMMONER_ID = response.data.id;
        TFT_SUMMONER_PUUID = response.data.puuid;
        client.say(channel, `TFT oyuncusu "${TFT_SUMMONER_NAME}" olarak ayarlandı.`);
      } catch (error) {
        const nickname = args.join(" ");
        client.say(channel, `${nickname}(${TFT_REGION}) hesabı bulunamadı.`);
        console.error('Hata oluştu:', error.response ? error.response.data : error.message);
      }
    } else if (command === "!tftregion") {
      TFT_REGION = args.join(" ");
      client.say(channel, `TFT Bölge "${TFT_REGION}" olarak ayarlandı.`);
    } else if (command === "!lolsummoner") {
      try {
        const nickname = args.join(" ");
        const response = await axios.get(`https://${LOL_REGION}1.api.riotgames.com/lol/summoner/v4/summoners/by-name/${nickname}?api_key=${RIOT_API_KEY}`);
        LOL_SUMMONER_NAME = response.data.name;
        LOL_SUMMONER_ID = response.data.id;
        LOL_SUMMONER_PUUID = response.data.puuid;
        client.say(channel, `LOL oyuncusu "${LOL_SUMMONER_NAME}" olarak ayarlandı.`);
      } catch (error) {
        const nickname = args.join(" ");
        client.say(channel, `${nickname}(${LOL_REGION}) hesabı bulunamadı.`);
        console.error('Hata oluştu:', error.response ? error.response.data : error.message);
      }
    } else if (command === "!lolregion") {
      LOL_REGION = args.join(" ");
      client.say(channel, `LOL Bölge "${LOL_REGION}" olarak ayarlandı.`);
    }
  }
  if (lastcommand !== "tftrank" && command === "!tftrank") {
    SetDelay('tftrank');
    FTftrank(channel);
  } else if (lastcommand !== "tftlastmatch" && (command === "!tftlastmatch" || command === "!tftlastgame")) {
    SetDelay('tftlastmatch');
    FTftlastmatch(channel);
  } else if (lastcommand !== "tftavg" && command === "!tftavg") {
    SetDelay('tftavg');
    FTftavg(channel);
  } else if (lastcommand !== "lolrank" && command === "!lolrank") {
    SetDelay('lolrank');
    FLolrank(channel);
  } else if (lastcommand !== "lollastmatch" && (command === "!lollastmatch" || command === "!lollastgame")) {
    SetDelay('lollastmatch');
    FLollastmatch(channel);
  } else if (lastcommand !== "runes" && command === "!runes") {
    SetDelay('runes');
    FLolrunes(channel);
  } else if (lastcommand !== "matchup" && command === "!matchup") {
    SetDelay('matchup');
    FLolmatchup(channel);
  } else if (lastcommand !== "winrate" && (command === "!winrate" || command === "!wr")) {
    SetDelay('winrate');
    FLolwinrate(channel);
  } else if (lastcommand !== "avgrank" && (command === "!avgrank" || command === "!elo")) {
    SetDelay('avgrank');
    FLolavg(channel);
  } else if (lastcommand !== "mostplayed" && command === "!mostplayed") {
    SetDelay('mostplayed');
    FLolmostplayed(channel);
  } else if (lastcommand !== "streak" && command === "!streak") {
    SetDelay('streak');
    Flolstreak(channel);
  } else if (lastcommand !== "mastery" && command === "!mastery") {
    SetDelay('mastery');
    FLolmastery(channel);
  } else if (lastcommand !== "commands" && (command === "!commands" || command == "!help")) {
    SetDelay('commands');
    client.say(channel, `LOL: !lolrank • !lollastmatch • !runes • !matchup • !winrate • !avgrank • !mostplayed • !streak | TFT: !tftrank • !tftlastmatch • !tftavg`);
  }
});

// TFT Rank
async function FTftrank(channel) {
  try {
    const { data } = await axios.get(`https://${TFT_REGION}1.api.riotgames.com/tft/league/v1/entries/by-summoner/${TFT_SUMMONER_ID}?api_key=${RIOT_API_KEY}`);
    const ranked = data.find((entry) => entry.queueType === "RANKED_TFT");
    if (ranked) {
      const { tier, rank, leaguePoints } = ranked;
      client.say(channel, `${TFT_SUMMONER_NAME} • ${`${tier} ${rank} (${leaguePoints} LP)`.replace(/(MASTER|GRANDMASTER|CHALLENGER) I/g, '$1').replace(new RegExp(Object.keys(translate).join("|"), "gi"), (match) => translate[match])}`);
    } else {
      client.say(channel, `${TFT_SUMMONER_NAME} • Derecesiz`);
    }
  } catch (error) {
    client.say(channel, `Lig verileri alınamadı veya derecesiz.`);
    console.error('Hata oluştu:', error.response ? error.response.data : error.message);
  }
}

// TFT Last Match
async function FTftlastmatch(channel) {
  try {
    const matchList = await axios.get(`https://europe.api.riotgames.com/tft/match/v1/matches/by-puuid/${TFT_SUMMONER_PUUID}/ids?count=1&api_key=${RIOT_API_KEY}`);
    const matchDetails = await axios.get(`https://europe.api.riotgames.com/tft/match/v1/matches/${matchList.data[0]}?api_key=${RIOT_API_KEY}`);
    const myParticipant = matchDetails.data.info.participants.find(participant => participant.puuid === TFT_SUMMONER_PUUID);
    client.say(channel, `${TFT_SUMMONER_NAME} • ${myParticipant.placement}. sıra • ${myParticipant.level}. seviye`);
  } catch (error) {
    client.say(channel, `Maç geçmişi alınamadı.`);
    console.error('Hata oluştu:', error.response ? error.response.data : error.message);
  }
}

// TFT Average Placement
async function FTftavg(channel) {
  try {
    const matchList = await axios.get(`https://europe.api.riotgames.com/tft/match/v1/matches/by-puuid/${TFT_SUMMONER_PUUID}/ids?api_key=${RIOT_API_KEY}`);
    const matchIds = matchList.data;
    let totalPlacement = 0;
    for (const matchId of matchIds) {
      const matchDetails = await axios.get(`https://europe.api.riotgames.com/tft/match/v1/matches/${matchId}?api_key=${RIOT_API_KEY}`);
      totalPlacement += matchDetails.data.info.participants.find(participant => participant.puuid === TFT_SUMMONER_PUUID)?.placement;
    }
    client.say(channel, `${TFT_SUMMONER_NAME} • ${matchIds.length} maç • Ortalama ${Math.floor(totalPlacement / matchIds.length * 10) / 10}`);
  } catch (error) {
    client.say(channel, `Maç geçmişi alınamadı.`);
    console.error('Hata oluştu:', error.response ? error.response.data : error.message);
  }
}

// LOL Rank
async function FLolrank(channel) {
  try {
    const { data } = await axios.get(`https://${LOL_REGION}1.api.riotgames.com/lol/league/v4/entries/by-summoner/${LOL_SUMMONER_ID}?api_key=${RIOT_API_KEY}`);
    const ranked = data.find((entry) => entry.queueType === "RANKED_SOLO_5x5");
    if (ranked) {
      const { tier, rank, leaguePoints } = ranked;
      client.say(channel, `${LOL_SUMMONER_NAME} • ${`${tier} ${rank} (${leaguePoints} LP)`.replace(/(MASTER|GRANDMASTER|CHALLENGER) I/g, '$1').replace(new RegExp(Object.keys(translate).join("|"), "gi"), (match) => translate[match])}`);
    } else {
      client.say(channel, `${LOL_SUMMONER_NAME} • Derecesiz`);
    }
  } catch (error) {
    client.say(channel, `Lig verileri alınamadı veya derecesiz.`);
    console.error('Hata oluştu:', error.response ? error.response.data : error.message);
  }
}

// LOL Last Match
async function FLollastmatch(channel) {
  try {
    const matchList = await axios.get(`https://europe.api.riotgames.com/lol/match/v5/matches/by-puuid/${LOL_SUMMONER_PUUID}/ids?api_key=${RIOT_API_KEY}`);
    if (!matchList.data?.length) {
      client.say(channel, 'Maç geçmişi alınamadı.');
      return;
    }
    const matchDetails = await axios.get(`https://europe.api.riotgames.com/lol/match/v5/matches/${matchList.data[0]}?api_key=${RIOT_API_KEY}`);
    const myParticipant = matchDetails.data.info.participants.find(participant => participant.puuid === LOL_SUMMONER_PUUID);
    client.say(channel, `${myParticipant.summonerName} • ${myParticipant.championName} (${myParticipant.kills}/${myParticipant.deaths}/${myParticipant.assists}) • ${myParticipant.win ? 'Zafer' : 'Bozgun'}`);
  } catch (error) {
    client.say(channel, `Maç geçmişi alınamadı.`);
    console.error('Hata oluştu:', error.response ? error.response.data : error.message);
  }
}

// LOL Runes
async function FLolrunes(channel) {
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
    client.say(channel, `${await getChampionName(player.championId)} • ${perkNames.slice(0, 4).join(' - ')} | ${perkNames.slice(4).join(' - ')}`);
  } catch (error) {
    client.say(channel, `Rün verileri alınamadı veya oyuncu maçta değil.`);
    console.error('Hata oluştu:', error.response ? error.response.data : error.message);
  }
}

// LOL Summoners Rank
async function FLolmatchup(channel) {
  try {
    const { data } = await axios.get(`https://${LOL_REGION}1.api.riotgames.com/lol/spectator/v4/active-games/by-summoner/${LOL_SUMMONER_ID}?api_key=${RIOT_API_KEY}`);
    const rankGroups = {};
    for (const participant of data.participants) {
      const leagueResponse = await axios.get(`https://${LOL_REGION}1.api.riotgames.com/lol/league/v4/entries/by-summoner/${participant.summonerId}?api_key=${RIOT_API_KEY}`);
      const leagueInfo = leagueResponse.data.find(entry => entry.queueType === 'RANKED_SOLO_5x5');
      const groupKey = leagueInfo ? `${leagueInfo.tier} ${leagueInfo.rank}` : 'UNRANKED';
      rankGroups[groupKey] = rankGroups[groupKey] || [];
      rankGroups[groupKey].push(await getChampionName(participant.championId));
    }
    const sortedRankGroups = Object.fromEntries(Object.entries(rankGroups).sort((a, b) => ranks[a[0]] - ranks[b[0]]));
    const sortedOutput = Object.entries(sortedRankGroups).map(([groupKey, champions]) => `${groupKey} (${champions.join(", ")})`).join(" • ");
    client.say(channel, `${sortedOutput.replace(/(MASTER|GRANDMASTER|CHALLENGER) I/g, '$1').replace(new RegExp(Object.keys(translate).join("|"), "gi"), (match) => translate[match])}`);
  } catch (error) {
    client.say(channel, `Lig verileri alınamadı veya oyuncu maçta değil.`);
    console.error('Hata oluştu:', error.response ? error.response.data : error.message);
  }
}

// LOL Win Rate
async function FLolwinrate(channel) {
  try {
    const { data } = await axios.get(`https://${LOL_REGION}1.api.riotgames.com/lol/league/v4/entries/by-summoner/${LOL_SUMMONER_ID}?api_key=${RIOT_API_KEY}`);
    const ranked = data.find((entry) => entry.queueType === 'RANKED_SOLO_5x5');
    if (ranked) {
      const { wins, losses } = ranked;
      const winRate = (wins / (wins + losses)) * 100;
      client.say(channel, `${LOL_SUMMONER_NAME} • SoloQ: ${wins}W ${losses}L ${winRate.toFixed(2)}%`);
    } else {
      client.say(channel, `${LOL_SUMMONER_NAME} • SoloQ maç geçmişi bulunamadı.`);
    }
  } catch (error) {
    client.say(channel, `Maç geçmişi alınamadı.`);
    console.error('Hata oluştu:', error.response ? error.response.data : error.message);
  }
}

// LOL Summoners Average Rank
async function FLolavg(channel) {
  try {
    const { data } = await axios.get(`https://${LOL_REGION}1.api.riotgames.com/lol/spectator/v4/active-games/by-summoner/${LOL_SUMMONER_ID}?api_key=${RIOT_API_KEY}`);
    let totalRankValue = 0;
    let totalPlayers = 0;
    for (const participant of data.participants) {
      const { data: leagueData } = await axios.get(`https://${LOL_REGION}1.api.riotgames.com/lol/league/v4/entries/by-summoner/${participant.summonerId}?api_key=${RIOT_API_KEY}`);
      const leagueInfo = leagueData.find((entry) => entry.queueType === "RANKED_SOLO_5x5");
      if (leagueInfo) {
        const { tier, rank } = leagueInfo;
        const rankValue = ranks[`${tier} ${rank}`] || 0;
        totalRankValue += rankValue;
        totalPlayers++;
      }
    }
    let averageRankName = Object.keys(ranks).find(rank => ranks[rank] === Math.round(totalRankValue / totalPlayers)) || 'Bilinmeyen Rank';
    client.say(channel, `Lig ortalaması: ${averageRankName.replace(/(MASTER|GRANDMASTER|CHALLENGER) I/g, '$1').replace(new RegExp(Object.keys(translate).join("|"), "gi"), (match) => translate[match])}`);
  } catch (error) {
    client.say(channel, `Lig verileri alınamadı veya oyuncu maçta değil.`);
    console.error('Hata oluştu:', error.response ? error.response.data : error.message);
  }
}

// LOL Most Played Champion
async function FLolmostplayed(channel) {
  try {
    const { data: [{ championId, championPoints }] } = await axios.get(`https://${LOL_REGION}1.api.riotgames.com/lol/champion-mastery/v4/champion-masteries/by-summoner/${LOL_SUMMONER_ID}?api_key=${RIOT_API_KEY}`);
    client.say(channel, `${LOL_SUMMONER_NAME} • ${await getChampionName(championId)} (${formatMasteryPoints(championPoints)})`);
  } catch (error) {
    client.say(channel, `Şampiyon verileri alınamadı.`);
    console.error('Hata oluştu:', error.response ? error.response.data : error.message);
  }
}

// LOL Win Streak
async function Flolstreak(channel) {
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
    client.say(channel, consecutiveWins === 0 ? `${LOL_SUMMONER_NAME} • Yenilmezlik serisi bulunamadı.` : `${LOL_SUMMONER_NAME} • ${consecutiveWins} maçtır yenilmiyor.`);
  } catch (error) {
    client.say(channel, `Maç geçmişi alınamadı.`);
    console.error('Hata oluştu:', error.response ? error.response.data : error.message);
  }
}

// LOL Summoners Champion Mastery
async function FLolmastery(channel) {
  try {
    const { data } = await axios.get(`https://${LOL_REGION}1.api.riotgames.com/lol/spectator/v4/active-games/by-summoner/${LOL_SUMMONER_ID}?api_key=${RIOT_API_KEY}`);
    const sortedParticipants = data.participants.sort((a, b) => a.teamId - b.teamId);
    const teamMessages = {};
    for (const participant of sortedParticipants) {
      const championId = participant.championId;
      const { data: masteryData } = await axios.get(`https://${LOL_REGION}1.api.riotgames.com/lol/champion-mastery/v4/champion-masteries/by-summoner/${participant.summonerId}?api_key=${RIOT_API_KEY}`);
      const championMastery = masteryData.find(entry => entry.championId === championId);
      const championName = await getChampionName(championId);
      teamMessages[participant.teamId] = teamMessages[participant.teamId] || [];
      teamMessages[participant.teamId].push(`${championName} (${championMastery ? formatMasteryPoints(championMastery.championPoints) : 0})`);
    }
    const message = Object.values(teamMessages).map(team => team.join(' • ')).join(' | ');
    client.say(channel, message);
  } catch (error) {
    client.say(channel, `Ustalık puanları alınamadı veya oyuncu maçta değil.`);
    console.error('Hata oluştu:', error.response ? error.response.data : error.message);
  }
}

// STOCK
const translate = { "UNRANKED": "Derecesiz", "IRON": "Demir", "BRONZE": "Bronz", "SILVER": "Gümüş", "GOLD": "Altın", "PLATINUM": "Platin", "EMERALD": "Zümrüt", "DIAMOND": "Elmas", "MASTER": "Ustalık", "GRANDMASTER": "Üstatlık", "CHALLENGER": "Şampiyonluk" };
const ranks = { "UNRANKED": 0, "IRON IV": 1, "IRON III": 2, "IRON II": 3, "IRON I": 4, "BRONZE IV": 5, "BRONZE III": 6, "BRONZE II": 7, "BRONZE I": 8, "SILVER IV": 9, "SILVER III": 10, "SILVER II": 11, "SILVER I": 12, "GOLD IV": 13, "GOLD III": 14, "GOLD II": 15, "GOLD I": 16, "PLATINUM IV": 17, "PLATINUM III": 18, "PLATINUM II": 19, "PLATINUM I": 20, "EMERALD IV": 21, "EMERALD III": 22, "EMERALD II": 23, "EMERALD I": 24, "DIAMOND IV": 25, "DIAMOND III": 26, "DIAMOND II": 27, "DIAMOND I": 28, "MASTER I": 29, "GRANDMASTER I": 30, "CHALLENGER I": 31 };

async function SetDelay(command) {
  boolen = true;
  setTimeout(() => { boolen = false; }, 3000);
  lastcommand = command;
  setTimeout(() => { if (lastcommand === command) { lastcommand = "" }; }, 30000);
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

function formatMasteryPoints(points) {
  return points >= 1e6 ? (points / 1e6).toFixed(1) + 'M' : points >= 1e3 ? (points / 1e3).toFixed(0) + 'K' : points.toString();
}