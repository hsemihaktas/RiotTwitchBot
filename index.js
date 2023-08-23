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

  const tftresponse = await axios.get(`https://${TFT_REGION}1.api.riotgames.com/tft/summoner/v1/summoners/by-name/${TFT_SUMMONER_NAME}?api_key=${RIOT_API_KEY}`);
  TFT_SUMMONER_NAME = tftresponse.data.name;
  TFT_SUMMONER_ID = tftresponse.data.id;
  TFT_SUMMONER_PUUID = tftresponse.data.puuid;

  const lolresponse = await axios.get(`https://${LOL_REGION}1.api.riotgames.com/lol/summoner/v4/summoners/by-name/${LOL_SUMMONER_NAME}?api_key=${RIOT_API_KEY}`);
  LOL_SUMMONER_NAME = lolresponse.data.name;
  LOL_SUMMONER_ID = lolresponse.data.id;
  LOL_SUMMONER_PUUID = lolresponse.data.puuid;
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
  } else if (lastcommand !== "commands" && (command === "!commands" || command == "!help")) {
    SetDelay('commands');
    client.say(channel, `LOL: !lolrank • !lollastmatch • !runes • !matchup • !winrate • !avgrank • !mostplayed • !streak | TFT: !tftrank • !tftlastmatch • !tftavg`);
  }
});

// TFT Rank
async function FTftrank(channel) {
  try {
    if (!TFT_SUMMONER_NAME) {
      client.say(channel, "Önce bir TFT oyuncusu ayarlamalısınız. Kullanım: !tftsummoner <oyuncu_adı>");
      return;
    }

    const leagueResponse = await axios.get(`https://${TFT_REGION}1.api.riotgames.com/tft/league/v1/entries/by-summoner/${TFT_SUMMONER_ID}?api_key=${RIOT_API_KEY}`);
    const rankedData = leagueResponse.data.find((entry) => entry.queueType === "RANKED_TFT");
    const translate = { "UNRANKED": "Derecesiz", "IRON": "Demir", "BRONZE": "Bronz", "SILVER": "Gümüş", "GOLD": "Altın", "PLATINUM": "Platin", "EMERALD": "Zümrüt", "DIAMOND": "Elmas", "MASTER": "Ustalık", "GRANDMASTER": "Üstatlık", "CHALLENGER": "Şampiyonluk" };

    const tierText = rankedData.tier === 'MASTER' || rankedData.tier === 'GRANDMASTER' || rankedData.tier === 'CHALLENGER'
      ? `${TFT_SUMMONER_NAME} • ${rankedData.tier} (${rankedData.leaguePoints} LP)`
      : `${TFT_SUMMONER_NAME} • ${rankedData.tier} ${rankedData.rank} (${rankedData.leaguePoints} LP)`;

    client.say(channel, tierText.replace(new RegExp(Object.keys(translate).join("|"), "gi"), (match) => translate[match]));
  } catch (error) {
    client.say(channel, `Lig verileri alınamadı.`);
    console.error('Hata oluştu:', error.response ? error.response.data : error.message);
  }
}

// TFT Last Match
async function FTftlastmatch(channel) {
  try {
    if (!TFT_SUMMONER_NAME) {
      client.say(channel, "Önce bir TFT oyuncusu ayarlamalısınız. Kullanım: !tftsummoner <oyuncu_adı>");
      return;
    }

    const matchList = await axios.get(`https://europe.api.riotgames.com/tft/match/v1/matches/by-puuid/${TFT_SUMMONER_PUUID}/ids?count=1&api_key=${RIOT_API_KEY}`);
    if (!matchList.data || matchList.data.length === 0) {
      client.say(channel, 'Maç geçmişi alınamadı.');
      return;
    }

    const matchDetails = await axios.get(`https://europe.api.riotgames.com/tft/match/v1/matches/${matchList.data[0]}?api_key=${RIOT_API_KEY}`);

    const playerPlacement = matchDetails.data.info.participants.find(participant => participant.puuid === TFT_SUMMONER_PUUID)?.placement;
    const playerLevel = matchDetails.data.info.participants.find(participant => participant.puuid === TFT_SUMMONER_PUUID)?.level;

    client.say(channel, `${TFT_SUMMONER_NAME} • ${playerPlacement}. sıra • ${playerLevel}. seviye`);
  } catch (error) {
    client.say(channel, `Maç geçmişi alınamadı.`);
    console.error('Hata oluştu:', error.response ? error.response.data : error.message);
  }
}

// TFT Average Placement
async function FTftavg(channel) {
  try {
    if (!TFT_SUMMONER_NAME) {
      client.say(channel, "Önce bir TFT oyuncusu ayarlamalısınız. Kullanım: !tftsummoner <oyuncu_adı>");
      return;
    }

    const response = await axios.get(`https://europe.api.riotgames.com/tft/match/v1/matches/by-puuid/${TFT_SUMMONER_PUUID}/ids?api_key=${RIOT_API_KEY}`);

    if (!response.data || response.data.length === 0) {
      client.say(channel, 'Maç geçmişi alınamadı.');
      return;
    }

    const matchIds = response.data;

    let totalPlacement = 0;
    for (const matchId of matchIds) {
      const matchDetails = await axios.get(`https://europe.api.riotgames.com/tft/match/v1/matches/${matchId}?api_key=${RIOT_API_KEY}`);
      const participant = matchDetails.data.info.participants.find(participant => participant.puuid === TFT_SUMMONER_PUUID);
      totalPlacement += participant.placement;
    }

    const roundedAveragePlacement = Math.floor(totalPlacement / matchIds.length * 10) / 10;
    client.say(channel, `${TFT_SUMMONER_NAME} • ${matchIds.length} maç • Ortalama ${roundedAveragePlacement}`);
  } catch (error) {
    client.say(channel, `Maç geçmişi alınamadı.`);
    console.error('Hata oluştu:', error.response ? error.response.data : error.message);
  }
}

// LOL Rank
async function FLolrank(channel) {
  try {
    if (!LOL_SUMMONER_NAME) {
      client.say(channel, "Önce bir LOL oyuncusu ayarlamalısınız. Kullanım: !lolsummoner <oyuncu_adı>");
      return;
    }

    const leagueResponse = await axios.get(`https://${LOL_REGION}1.api.riotgames.com/lol/league/v4/entries/by-summoner/${LOL_SUMMONER_ID}?api_key=${RIOT_API_KEY}`);
    const rankedData = leagueResponse.data.find((entry) => entry.queueType === "RANKED_SOLO_5x5");
    const translate = { "UNRANKED": "Derecesiz", "IRON": "Demir", "BRONZE": "Bronz", "SILVER": "Gümüş", "GOLD": "Altın", "PLATINUM": "Platin", "EMERALD": "Zümrüt", "DIAMOND": "Elmas", "MASTER": "Ustalık", "GRANDMASTER": "Üstatlık", "CHALLENGER": "Şampiyonluk" };

    const tierText = rankedData.tier === 'MASTER' || rankedData.tier === 'GRANDMASTER' || rankedData.tier === 'CHALLENGER'
      ? `${LOL_SUMMONER_NAME} • ${rankedData.tier} (${rankedData.leaguePoints} LP)`
      : `${LOL_SUMMONER_NAME} • ${rankedData.tier} ${rankedData.rank} (${rankedData.leaguePoints} LP)`;

    client.say(channel, tierText.replace(new RegExp(Object.keys(translate).join("|"), "gi"), (match) => translate[match]));
  } catch (error) {
    client.say(channel, `Lig verileri alınamadı.`);
    console.error('Hata oluştu:', error.response ? error.response.data : error.message);
  }
}

// LOL Last Match
async function FLollastmatch(channel) {
  try {
    if (!LOL_SUMMONER_NAME) {
      client.say(channel, "Önce bir LOL oyuncusu ayarlamalısınız. Kullanım: !lolsummoner <oyuncu_adı>");
      return;
    }

    const matchlistResponse = await axios.get(`https://europe.api.riotgames.com/lol/match/v5/matches/by-puuid/${LOL_SUMMONER_PUUID}/ids?api_key=${RIOT_API_KEY}`);
    if (!matchlistResponse.data || matchlistResponse.data.length === 0) {
      client.say(channel, 'Maç geçmişi alınamadı.');
      return;
    }

    const matchDataResponse = await axios.get(`https://europe.api.riotgames.com/lol/match/v5/matches/${matchlistResponse.data[0]}?api_key=${RIOT_API_KEY}`);
    const myParticipant = matchDataResponse.data.info.participants.find(participant => participant.puuid === LOL_SUMMONER_PUUID);
    client.say(channel, `${myParticipant.summonerName} • ${myParticipant.championName} (${myParticipant.kills}/${myParticipant.deaths}/${myParticipant.assists}) • ${myParticipant.win ? 'Zafer' : 'Bozgun'}`);
  } catch (error) {
    client.say(channel, `Maç geçmişi alınamadı.`);
    console.error('Hata oluştu:', error.response ? error.response.data : error.message);
  }
}

// LOL Runes
async function FLolrunes(channel) {
  try {
    if (!LOL_SUMMONER_NAME) {
      client.say(channel, "Önce bir LOL oyuncusu ayarlamalısınız. Kullanım: !lolsummoner <oyuncu_adı>");
      return;
    }

    const activeGameResponse = await axios.get(`https://${LOL_REGION}1.api.riotgames.com/lol/spectator/v4/active-games/by-summoner/${LOL_SUMMONER_ID}?api_key=${RIOT_API_KEY}`);
    const activeGame = activeGameResponse.data;
    if (!activeGame.participants) {
      client.say(channel, 'Oyuncu maçta değil.');
      return;
    }

    const playerData = activeGame.participants.find(player => player.summonerName === LOL_SUMMONER_NAME);
    if (!playerData) {
      client.say(channel, 'Rün verileri alınamadı.');
      return;
    }

    const championId = playerData.championId;
    const perkIds = playerData.perks.perkIds.slice(0, 6);
    const versionResponse = await fetch(`https://ddragon.leagueoflegends.com/api/versions.json`);
    const versionData = await versionResponse.json();
    try {
      const perkResponse = await axios.get(`http://ddragon.leagueoflegends.com/cdn/${versionData[0]}/data/tr_TR/runesReforged.json`);
      const perkNames = [];
      for (let i = 0; i < perkIds.length; i++) {
        let foundPerkName = null;

        for (const perkStyle of perkResponse.data) {
          for (const slot of perkStyle.slots) {
            for (const perk of slot.runes) {
              if (perk.id === perkIds[i]) {
                foundPerkName = perk.name;
                break;
              }
            }
            if (foundPerkName) {
              break;
            }
          }
          if (foundPerkName) {
            break;
          }
        }

        const perkName = foundPerkName || 'Unknown Rune';
        perkNames.push(perkName);
      }

      const championData = await axios.get(`http://ddragon.leagueoflegends.com/cdn/${versionData[0]}/data/en_US/champion.json`);
      const championKey = Object.keys(championData.data.data).find((key) => championData.data.data[key].key == championId.toString());
      const championName = championKey ? championData.data.data[championKey].name : "Bilinmeyen Şampiyon";

      client.say(channel, `${championName} • ${perkNames.slice(0, 4).join(' - ')} | ${perkNames.slice(4).join(' - ')}`);
    } catch (error) {
      console.error('Hata oluştu:', error.response ? error.response.data : error.message);
    }
  } catch (error) {
    client.say(channel, `Rün verileri alınamadı.`);
    console.error('Hata oluştu:', error.response ? error.response.data : error.message);
  }
}

// LOL Matchup
async function FLolmatchup(channel) {
  try {
    if (!LOL_SUMMONER_NAME) {
      client.say(channel, "Önce bir LOL oyuncusu ayarlamalısınız. Kullanım: !lolsummoner <oyuncu_adı>");
      return;
    }

    const activeGameResponse = await fetch(`https://${LOL_REGION}1.api.riotgames.com/lol/spectator/v4/active-games/by-summoner/${LOL_SUMMONER_ID}?api_key=${RIOT_API_KEY}`);
    const activeGameData = await activeGameResponse.json();
    if (!activeGameData.participants) {
      client.say(channel, 'Oyuncu maçta değil.');
      return;
    }

    const ranks = { "UNRANKED": 0, "IRON IV": 1, "IRON III": 2, "IRON II": 3, "IRON I": 4, "BRONZE IV": 5, "BRONZE III": 6, "BRONZE II": 7, "BRONZE I": 8, "SILVER IV": 9, "SILVER III": 10, "SILVER II": 11, "SILVER I": 12, "GOLD IV": 13, "GOLD III": 14, "GOLD II": 15, "GOLD I": 16, "PLATINUM IV": 17, "PLATINUM III": 18, "PLATINUM II": 19, "PLATINUM I": 20, "EMERALD IV": 21, "EMERALD III": 22, "EMERALD II": 23, "EMERALD I": 24, "DIAMOND IV": 25, "DIAMOND III": 26, "DIAMOND II": 27, "DIAMOND I": 28, "MASTER": 29, "GRANDMASTER": 30, "CHALLENGER": 31 };
    const rankGroups = {};

    await Promise.all(activeGameData.participants.map(async participant => {
      const summonerId = participant.summonerId;

      const leagueResponse = await fetch(`https://${LOL_REGION}` + `1.api.riotgames.com/lol/league/v4/entries/by-summoner/${summonerId}?api_key=${RIOT_API_KEY}`);
      const leagueData = await leagueResponse.json();

      const leagueInfo = leagueData.find(entry => entry.queueType === 'RANKED_SOLO_5x5');
      const championId = participant.championId;

      if (leagueInfo) {
        let groupKey;
        const { tier, rank } = leagueInfo;
        const championName = await getChampionName(championId);
        if (tier === 'MASTER' || tier === 'GRANDMASTER' || tier === 'CHALLENGER') {
          groupKey = `${tier}`;
        } else {
          groupKey = `${tier} ${rank}`;
        }
        if (!rankGroups[groupKey]) {
          rankGroups[groupKey] = [];
        }

        rankGroups[groupKey].push(championName);
      } else {
        const championName = await getChampionName(championId);

        const groupKey = 'UNRANKED';
        if (!rankGroups[groupKey]) {
          rankGroups[groupKey] = [];
        }

        rankGroups[groupKey].push(championName);
      }
    }));

    const sortedRankGroups = Object.keys(rankGroups)
      .sort((a, b) => ranks[a] - ranks[b])
      .reduce((obj, key) => {
        obj[key] = rankGroups[key];
        return obj;
      }, {});

    const sortedOutput = Object.entries(sortedRankGroups).map(([groupKey, champions]) => {
      return `${groupKey} (${champions.join(", ")})`;
    }).join(" • ");
    const translate = { "UNRANKED": "Derecesiz", "IRON": "Demir", "BRONZE": "Bronz", "SILVER": "Gümüş", "GOLD": "Altın", "PLATINUM": "Platin", "EMERALD": "Zümrüt", "DIAMOND": "Elmas", "MASTER": "Ustalık", "GRANDMASTER": "Üstatlık", "CHALLENGER": "Şampiyonluk" };
    client.say(channel, `${sortedOutput.replace(new RegExp(Object.keys(translate).join("|"), "gi"), (match) => translate[match])}`);
  } catch (error) {
    client.say(channel, `Lig verileri alınamadı.`);
    console.error('Hata oluştu:', error.response ? error.response.data : error.message);
  }
}

// LOL Win Rate
async function FLolwinrate(channel) {
  try {
    if (!LOL_SUMMONER_NAME) {
      client.say(channel, "Önce bir LOL oyuncusu ayarlamalısınız. Kullanım: !lolsummoner <oyuncu_adı>");
      return;
    }

    const leagueResponse = await axios.get(`https://${LOL_REGION}1.api.riotgames.com/lol/league/v4/entries/by-summoner/${LOL_SUMMONER_ID}?api_key=${RIOT_API_KEY}`);

    const rankedSoloData = leagueResponse.data.find((entry) => entry.queueType === 'RANKED_SOLO_5x5');

    if (rankedSoloData) {
      const wins = rankedSoloData.wins;
      const losses = rankedSoloData.losses;
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

// LOL Average Rank
async function FLolavg(channel) {
  try {
    if (!LOL_SUMMONER_NAME) {
      client.say(channel, "Önce bir LOL oyuncusu ayarlamalısınız. Kullanım: !lolsummoner <oyuncu_adı>");
      return;
    }

    const activeGameResponse = await fetch(`https://${LOL_REGION}1.api.riotgames.com/lol/spectator/v4/active-games/by-summoner/${LOL_SUMMONER_ID}?api_key=${RIOT_API_KEY}`);
    const activeGameData = await activeGameResponse.json();
    if (!activeGameData.participants) {
      client.say(channel, 'Oyuncu maçta değil.');
      return;
    }

    const ranks = { "UNRANKED": 0, "IRON IV": 1, "IRON III": 2, "IRON II": 3, "IRON I": 4, "BRONZE IV": 5, "BRONZE III": 6, "BRONZE II": 7, "BRONZE I": 8, "SILVER IV": 9, "SILVER III": 10, "SILVER II": 11, "SILVER I": 12, "GOLD IV": 13, "GOLD III": 14, "GOLD II": 15, "GOLD I": 16, "PLATINUM IV": 17, "PLATINUM III": 18, "PLATINUM II": 19, "PLATINUM I": 20, "EMERALD IV": 21, "EMERALD III": 22, "EMERALD II": 23, "EMERALD I": 24, "DIAMOND IV": 25, "DIAMOND III": 26, "DIAMOND II": 27, "DIAMOND I": 28, "MASTER I": 29, "GRANDMASTER I": 30, "CHALLENGER I": 31 };
    let totalRankValue = 0;
    let totalPlayers = 0;

    await Promise.all(activeGameData.participants.map(async participant => {
      const leagueResponse = await fetch(`https://${LOL_REGION}1.api.riotgames.com/lol/league/v4/entries/by-summoner/${participant.summonerId}?api_key=${RIOT_API_KEY}`);
      const leagueData = await leagueResponse.json();

      const leagueInfo = leagueData.find(entry => entry.queueType === 'RANKED_SOLO_5x5');

      if (leagueInfo) {
        const { tier, rank } = leagueInfo;
        const rankValue = ranks[`${tier} ${rank}`] || 0;
        totalRankValue += rankValue;
        totalPlayers++;
      }
    }));

    let averageRankValue = Math.round(totalRankValue / totalPlayers);
    let averageRankName = 'Bilinmeyen Rank';

    for (const rank in ranks) if (ranks[rank] === averageRankValue) averageRankName = rank;
    const regex = /(MASTER|GRANDMASTER|CHALLENGER)\sI$/;
    const message = averageRankName.replace(regex, "$1");
    const translate = { "UNRANKED": "Derecesiz", "IRON": "Demir", "BRONZE": "Bronz", "SILVER": "Gümüş", "GOLD": "Altın", "PLATINUM": "Platin", "EMERALD": "Zümrüt", "DIAMOND": "Elmas", "MASTER": "Ustalık", "GRANDMASTER": "Üstatlık", "CHALLENGER": "Şampiyonluk" };
    client.say(channel, `Lig ortalaması: ${message.replace(new RegExp(Object.keys(translate).join("|"), "gi"), (match) => translate[match])}`);
  } catch (error) {
    client.say(channel, `Lig verileri alınamadı.`);
    console.error('Hata oluştu:', error.response ? error.response.data : error.message);
  }
}

// LOL Mostplayed
async function FLolmostplayed(channel) {
  try {
    if (!LOL_SUMMONER_NAME) {
      client.say(channel, "Önce bir LOL oyuncusu ayarlamalısınız. Kullanım: !lolsummoner <oyuncu_adı>");
      return;
    }

    const masteryResponse = await axios.get(`https://${LOL_REGION}1.api.riotgames.com/lol/champion-mastery/v4/champion-masteries/by-summoner/${LOL_SUMMONER_ID}?api_key=${RIOT_API_KEY}`);
    const topChampion = masteryResponse.data[0];
    const championId = topChampion.championId;
    const championPoints = formatMasteryPoints(topChampion.championPoints);

    const championName = await getChampionName(championId);
    client.say(channel, `${LOL_SUMMONER_NAME} • ${championName} (${championPoints})`);
  } catch (error) {
    client.say(channel, `Şampiyon verileri alınamadı.`);
    console.error('Hata oluştu:', error.response ? error.response.data : error.message);
  }
}

// LOL Streak
async function Flolstreak(channel) {
  try {
    if (!LOL_SUMMONER_NAME) {
      client.say(channel, "Önce bir LOL oyuncusu ayarlamalısınız. Kullanım: !lolsummoner <oyuncu_adı>");
      return;
    }

    const matchListResponse = await axios.get(`https://europe.api.riotgames.com/lol/match/v5/matches/by-puuid/${LOL_SUMMONER_PUUID}/ids?start=0&count=100&api_key=${RIOT_API_KEY}`);
    const matchIds = matchListResponse.data;

    let consecutiveWins = 0;
    for (const matchId of matchIds) {
      const match = (await axios.get(`https://europe.api.riotgames.com/lol/match/v5/matches/${matchId}?api_key=${RIOT_API_KEY}`)).data;
      const participant = match.info.participants.find(p => p.puuid === LOL_SUMMONER_PUUID);
      if (participant && participant.win) {
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

// STOCK
async function SetDelay(command) {
  boolen = true;
  setTimeout(() => { boolen = false; }, 3000);
  lastcommand = command;
  setTimeout(() => { if (lastcommand === command) { lastcommand = "" }; }, 30000);
}

async function getChampionName(championId) {
  try {
    const versionResponse = await fetch(`https://ddragon.leagueoflegends.com/api/versions.json`);
    const versionData = await versionResponse.json();
    const championResponse = await fetch(`https://ddragon.leagueoflegends.com/cdn/${versionData[0]}/data/tr_TR/champion.json`);
    const championData = await championResponse.json();

    for (const champion in championData.data) {
      if (championData.data[champion].key === String(championId)) {
        return championData.data[champion].name;
      }
    }

    return 'Bilinmeyen Karakter';
  } catch (error) {
    console.error('Karakter ismi çekilirken hata:', error.message);
    return 'Bilinmeyen Karakter';
  }
}

function formatMasteryPoints(points) {
  if (points >= 1e6) {
    return (points / 1e6).toFixed(1) + 'M';
  } else if (points >= 1e3) {
    return (points / 1e3).toFixed(0) + 'K';
  } else {
    return points.toString();
  }
}