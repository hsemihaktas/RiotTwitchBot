const tmi = require("tmi.js");
const axios = require("axios");

const RIOT_API_KEY = 'RGAPI-KEY';

const opts = {
  identity: {
    username: "TWITCH BOT USERNAME",
    password: "TWITCH BOT oauth:TOKEN",
  },
  channels: ["channel1","channel2"],
};

const client = new tmi.client(opts);

const channelConfigs = {
  'channel1': {
    LOL_SUMMONER_NAME: 'LOL SUMMONER NAME',
    LOL_REGION: 'TR | EUW',
    TFT_SUMMONER_NAME: 'TFT SUMMONER NAME',
    TFT_REGION: 'TR | EUW'
  },
  'channel2': {
    LOL_SUMMONER_NAME: 'LOL SUMMONER NAME',
    LOL_REGION: 'TR | EUW',
    TFT_SUMMONER_NAME: 'TFT SUMMONER NAME',
    TFT_REGION: 'TR | EUW'
  },
};

let lastcommand;
let boolen = false;

client.connect();

client.on("connected", (address, port) => {
  console.log(`Bot başarıyla Twitch sunucusuna bağlandı: ${address}:${port}`);
});

client.on("message", async (channel, userstate, message, self) => {
  if (self || boolen || !message.startsWith('!')) return;

  const args = message.split(" ");
  const command = args[0].toLowerCase();
  args.shift();

  if (lastcommand === command) return;

  const badges = userstate.badges;
  if (badges && (badges.moderator || badges.broadcaster) && args.length > 0) {
    if (command === "!tftsummoner") {
      
      const channelConfig = channelConfigs[channel.slice(1).toLowerCase()];

      try {
        const nickname = args.join(" ");
        const response = await axios.get(`https://${channelConfig.TFT_REGION}1.api.riotgames.com/tft/summoner/v1/summoners/by-name/${nickname}?api_key=${RIOT_API_KEY}`);
        channelConfig.TFT_SUMMONER_NAME = response.data.name;
        client.say(channel, `TFT oyuncusu "${channelConfig.TFT_SUMMONER_NAME}" olarak ayarlandı.`);
      } catch (error) {
        const nickname = args.join(" ");
        client.say(channel, `${nickname}(${channelConfig.TFT_REGION}) hesabı bulunamadı.`);
        if (error.response) {
          console.error('API Hata Durumu:', error.response.status);
          console.error('API Hata Mesajı:', error.response.data);
        } else {
          console.error('İstek gönderilirken bir hata oluştu:', error.message);
        }
      }
    } else if (command === "!tftregion") {
      const channelConfig = channelConfigs[channel.slice(1).toLowerCase()];
      TFT_REGION = args.join(" ");
      channelConfig.TFT_REGION = TFT_REGION;
      client.say(channel, `TFT Bölge "${channelConfig.TFT_REGION}" olarak ayarlandı.`);
    } else if (command === "!lolsummoner") {

      const channelConfig = channelConfigs[channel.slice(1).toLowerCase()];

      try {
        const nickname = args.join(" ");
        const response = await axios.get(`https://${channelConfig.LOL_REGION}1.api.riotgames.com/lol/summoner/v4/summoners/by-name/${nickname}?api_key=${RIOT_API_KEY}`);
        channelConfig.LOL_SUMMONER_NAME = response.data.name;
        client.say(channel, `LOL oyuncusu "${channelConfig.LOL_SUMMONER_NAME}" olarak ayarlandı.`);
      } catch (error) {
        const nickname = args.join(" ");
        client.say(channel, `${nickname}(${channelConfig.LOL_REGION}) hesabı bulunamadı.`);
        if (error.response) {
          console.error('API Hata Durumu:', error.response.status);
          console.error('API Hata Mesajı:', error.response.data);
        } else {
          console.error('İstek gönderilirken bir hata oluştu:', error.message);
        }
      }
    } else if (command === "!lolregion") {
      const channelConfig = channelConfigs[channel.slice(1).toLowerCase()];
      LOL_REGION = args.join(" ");
      channelConfig.LOL_REGION = LOL_REGION;
      client.say(channel, `LOL Bölge "${channelConfig.LOL_REGION}" olarak ayarlandı.`);
    }
  }
  if (command === "!tftrank") {
    SetDelay(command);
    FTftrank(channel);
  } else if (command === "!tftlastmatch") {
    SetDelay(command);
    FTftlastmatch(channel);
  } else if (command === "!tftavg") {
    SetDelay(command);
    FTftavg(channel);
  } else if (command === "!lolrank") {
    SetDelay(command);
    FLolrank(channel);
  } else if (command === "!lollastmatch") {
    SetDelay(command);
    FLollastmatch(channel);
  } else if (command === "!runes") {
    SetDelay(command);
    FLolrunes(channel);
  } else if (command === "!matchup") {
    SetDelay(command);
    FLolmatchup(channel);
  } else if (command === "!wr" || command === "!winrate") {
    SetDelay(command);
    FLolwinrate(channel);
  } else if (command == "!avgrank") {
    SetDelay(command);
    FLolavg(channel);
  }
});


async function SetDelay(command) {
  boolen = true;
  setTimeout(() => { boolen = false; }, 3000);
  lastcommand = command;
  setTimeout(() => { if (lastcommand === command) { lastcommand = "" }; }, 30000);
}

// TFT Rank
async function FTftrank(channel) {

  const channelConfig = channelConfigs[channel.slice(1).toLowerCase()];

  try {
    if (channelConfig.TFT_SUMMONER_NAME === "") {
      client.say(channel, "Önce bir TFT oyuncusu ayarlamalısınız. Kullanım: !tftsummoner <oyuncu_adı>");
      return;
    }

    const summonerResponse = await axios.get(`https://${channelConfig.TFT_REGION}1.api.riotgames.com/tft/summoner/v1/summoners/by-name/${channelConfig.TFT_SUMMONER_NAME}?api_key=${RIOT_API_KEY}`);
    const leagueResponse = await axios.get(`https://${channelConfig.TFT_REGION}1.api.riotgames.com/tft/league/v1/entries/by-summoner/${summonerResponse.data.id}?api_key=${RIOT_API_KEY}`);
    const rankedData = leagueResponse.data.find((entry) => entry.queueType === "RANKED_TFT");

    if (rankedData.tier === 'MASTER' || rankedData.tier === 'GRANDMASTER' || rankedData.tier === 'CHALLENGER') {
      client.say(channel, rankedData !== undefined ? `${channelConfig.TFT_SUMMONER_NAME} • ${rankedData.tier} (${rankedData.leaguePoints} LP)` : `TFT ranked verileri alınamadı.`);
    }
    else {
      client.say(channel, rankedData !== undefined ? `${channelConfig.TFT_SUMMONER_NAME} • ${rankedData.tier} ${rankedData.rank} (${rankedData.leaguePoints} LP)` : `TFT ranked verileri alınamadı.`);
    }

  } catch (error) {
    client.say(channel, `TFT ranked verileri alınamadı.`);
    if (error.response) {
      console.error('API Hata Durumu:', error.response.status);
      console.error('API Hata Mesajı:', error.response.data);
    } else {
      console.error('İstek gönderilirken bir hata oluştu:', error.message);
    }
  }
}

// TFT Last Match
async function FTftlastmatch(channel) {

  const channelConfig = channelConfigs[channel.slice(1).toLowerCase()];

  try {
    if (channelConfig.TFT_SUMMONER_NAME === "") {
      client.say(channel, "Önce bir TFT oyuncusu ayarlamalısınız. Kullanım: !tftsummoner <oyuncu_adı>");
      return;
    }

    const summoner = await axios.get(`https://${channelConfig.TFT_REGION}1.api.riotgames.com/tft/summoner/v1/summoners/by-name/${channelConfig.TFT_SUMMONER_NAME}?api_key=${RIOT_API_KEY}`);
    const matchList = await axios.get(`https://europe.api.riotgames.com/tft/match/v1/matches/by-puuid/${summoner.data.puuid}/ids?count=1&api_key=${RIOT_API_KEY}`);
    const matchDetails = await axios.get(`https://europe.api.riotgames.com/tft/match/v1/matches/${matchList.data[0]}?api_key=${RIOT_API_KEY}`);

    const playerPlacement = matchDetails.data.info.participants.find(participant => participant.puuid === summoner.data.puuid)?.placement;
    const playerLevel = matchDetails.data.info.participants.find(participant => participant.puuid === summoner.data.puuid)?.level;

    client.say(channel, playerPlacement !== undefined ? `${channelConfig.TFT_SUMMONER_NAME} • ${playerPlacement}. Sıra • ${playerLevel} Level` : 'Son TFT maçının verileri alınamadı.');
  } catch (error) {
    client.say(channel, `Son TFT maçının verileri alınamadı.`);
    if (error.response) {
      console.error('API Hata Durumu:', error.response.status);
      console.error('API Hata Mesajı:', error.response.data);
    } else {
      console.error('İstek gönderilirken bir hata oluştu:', error.message);
    }
  }
}

// TFT Avg Placement
async function FTftavg(channel) {

  const channelConfig = channelConfigs[channel.slice(1).toLowerCase()];

  try {
    if (channelConfig.TFT_SUMMONER_NAME === "") {
      client.say(channel, "Önce bir TFT oyuncusu ayarlamalısınız. Kullanım: !tftsummoner <oyuncu_adı>");
      return;
    }

    const puuidResponse = await axios.get(`https://${channelConfig.TFT_REGION}1.api.riotgames.com/lol/summoner/v4/summoners/by-name/${channelConfig.TFT_SUMMONER_NAME}?api_key=${RIOT_API_KEY}`);
    const puuid = puuidResponse.data.puuid;

    const response = await axios.get(`https://europe.api.riotgames.com/tft/match/v1/matches/by-puuid/${puuid}/ids?api_key=${RIOT_API_KEY}`);

    if (!response.data || response.data.length === 0) {
      client.say(channel, 'Oyuncunun maç geçmişi bulunamadı.');
      return;
    }

    const matchIds = response.data;

    let totalPlacement = 0;
    for (const matchId of matchIds) {
      const matchDetails = await axios.get(`https://europe.api.riotgames.com/tft/match/v1/matches/${matchId}?api_key=${RIOT_API_KEY}`);
      const participant = matchDetails.data.info.participants.find(participant => participant.puuid === puuid);
      totalPlacement += participant.placement;
    }

    const averagePlacement = totalPlacement / matchIds.length;
    const roundedAveragePlacement = Math.floor(averagePlacement * 10) / 10;
    client.say(channel, `${channelConfig.TFT_SUMMONER_NAME} • ${matchIds.length} maç • Ortalama sıralama ${roundedAveragePlacement}`);
  } catch (error) {
    client.say(channel, 'Oyuncunun maç geçmişi bulunamadı.');
    if (error.response) {
      console.error('API Hata Durumu:', error.response.status);
      console.error('API Hata Mesajı:', error.response.data);
    } else {
      console.error('İstek gönderilirken bir hata oluştu:', error.message);
    }
  }
}

// LOL Rank
async function FLolrank(channel) {

  const channelConfig = channelConfigs[channel.slice(1).toLowerCase()];

  try {
    if (channelConfig.LOL_SUMMONER_NAME === "") {
      client.say(channel, "Önce bir LOL oyuncusu ayarlamalısınız. Kullanım: !lolsummoner <oyuncu_adı>");
      return;
    }

    const summonerResponse = await axios.get(`https://${channelConfig.LOL_REGION}1.api.riotgames.com/lol/summoner/v4/summoners/by-name/${channelConfig.LOL_SUMMONER_NAME}?api_key=${RIOT_API_KEY}`);
    const leagueResponse = await axios.get(`https://${channelConfig.LOL_REGION}1.api.riotgames.com/lol/league/v4/entries/by-summoner/${summonerResponse.data.id}?api_key=${RIOT_API_KEY}`);
    const rankedData = leagueResponse.data.find((entry) => entry.queueType === "RANKED_SOLO_5x5");
    if (rankedData.tier === 'MASTER' || rankedData.tier === 'GRANDMASTER' || rankedData.tier === 'CHALLENGER') {
      client.say(channel, rankedData !== undefined ? `${channelConfig.LOL_SUMMONER_NAME} • ${rankedData.tier} (${rankedData.leaguePoints} LP)` : `Lol ranked verileri alınamadı.`);
    }
    else {
      client.say(channel, rankedData !== undefined ? `${channelConfig.LOL_SUMMONER_NAME} • ${rankedData.tier} ${rankedData.rank} (${rankedData.leaguePoints} LP)` : "LoL ranked verileri alınamadı.");
    }

  } catch (error) {
    client.say(channel, `LoL ranked verileri alınamadı.`);
    if (error.response) {
      console.error('API Hata Durumu:', error.response.status);
      console.error('API Hata Mesajı:', error.response.data);
    } else {
      console.error('İstek gönderilirken bir hata oluştu:', error.message);
    }
  }
}

// LOL Last Match
async function FLollastmatch(channel) {

  const channelConfig = channelConfigs[channel.slice(1).toLowerCase()];

  try {
    if (channelConfig.LOL_SUMMONER_NAME === "") {
      client.say(channel, "Önce bir LOL oyuncusu ayarlamalısınız. Kullanım: !lolsummoner <oyuncu_adı>");
      return;
    }

    const summonerResponse = await axios.get(`https://${channelConfig.LOL_REGION}1.api.riotgames.com/lol/summoner/v4/summoners/by-name/${channelConfig.LOL_SUMMONER_NAME}?api_key=${RIOT_API_KEY}`);
    const matchlistResponse = await axios.get(`https://europe.api.riotgames.com/lol/match/v5/matches/by-puuid/${summonerResponse.data.puuid}/ids?api_key=${RIOT_API_KEY}`);
    const matchDataResponse = await axios.get(`https://europe.api.riotgames.com/lol/match/v5/matches/${matchlistResponse.data[0]}?api_key=${RIOT_API_KEY}`);
    const myParticipant = matchDataResponse.data.info.participants.find(participant => participant.puuid === summonerResponse.data.puuid);

    const champion = myParticipant.championName;
    const kills = myParticipant.kills;
    const deaths = myParticipant.deaths;
    const assists = myParticipant.assists;
    const win = myParticipant.win;
    const lose = win ? 'Zafer' : 'Bozgun';
    const name = myParticipant.summonerName;

    client.say(channel, champion !== undefined ? `${name} • ${champion} (${kills}/${deaths}/${assists}) • ${lose}` : 'Son LoL maçının verileri alınamadı.');
  } catch (error) {
    client.say(channel, `Son LoL maçının verileri alınamadı.`);
    if (error.response) {
      console.error('API Hata Durumu:', error.response.status);
      console.error('API Hata Mesajı:', error.response.data);
    } else {
      console.error('İstek gönderilirken bir hata oluştu:', error.message);
    }
  }
}

// LOL Runes
async function FLolrunes(channel) {

  const channelConfig = channelConfigs[channel.slice(1).toLowerCase()];

  try {
    if (channelConfig.LOL_SUMMONER_NAME === "") {
      client.say(channel, "Önce bir LOL oyuncusu ayarlamalısınız. Kullanım: !lolsummoner <oyuncu_adı>");
      return;
    }

    const summonerResponse = await axios.get(`https://${channelConfig.LOL_REGION}1.api.riotgames.com/lol/summoner/v4/summoners/by-name/${channelConfig.LOL_SUMMONER_NAME}?api_key=${RIOT_API_KEY}`);
    const summonerId = summonerResponse.data.id;

    const activeGameResponse = await axios.get(`https://${channelConfig.LOL_REGION}1.api.riotgames.com/lol/spectator/v4/active-games/by-summoner/${summonerId}?api_key=${RIOT_API_KEY}`);
    const activeGame = activeGameResponse.data;

    const playerData = activeGame.participants.find(player => player.summonerName === channelConfig.LOL_SUMMONER_NAME);
    if (!playerData) {
      client.say(channel, 'Rün verileri alınamadı.');
      return;
    }
    const championId = playerData.championId;
    const perkIds = playerData.perks.perkIds.slice(0, 6); // Only take the first 6 runes
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

      client.say(channel, perkNames !== undefined ? `${championName} • ${perkNames.slice(0, 4).join(' - ')} | ${perkNames.slice(4).join(' - ')}` : `Rün verileri alınamadı.`);
    } catch (error) {
      if (error.response) {
        console.error('API Hata Durumu:', error.response.status);
        console.error('API Hata Mesajı:', error.response.data);
      } else {
        console.error('İstek gönderilirken bir hata oluştu:', error.message);
      }
    }
  } catch (error) {
    client.say(channel, 'Rün verileri alınamadı.');
    if (error.response) {
      console.error('API Hata Durumu:', error.response.status);
      console.error('API Hata Mesajı:', error.response.data);
    } else {
      console.error('İstek gönderilirken bir hata oluştu:', error.message);
    }
  }
}

// LOL Matchup
async function FLolmatchup(channel) {

  const channelConfig = channelConfigs[channel.slice(1).toLowerCase()];

  try {
    if (channelConfig.LOL_SUMMONER_NAME === "") {
      client.say(channel, "Önce bir LOL oyuncusu ayarlamalısınız. Kullanım: !lolsummoner <oyuncu_adı>");
      return;
    }

    const versionResponse = await fetch(`https://ddragon.leagueoflegends.com/api/versions.json`);
    const versionData = await versionResponse.json();
    const getChampionName = async (championId) => {
      try {
        const championResponse = await fetch(`https://ddragon.leagueoflegends.com/cdn/${versionData[0]}/data/en_US/champion.json`);
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
    };

    const summonerResponse = await fetch(`https://${channelConfig.LOL_REGION}1.api.riotgames.com/lol/summoner/v4/summoners/by-name/${encodeURIComponent(channelConfig.LOL_SUMMONER_NAME)}?api_key=${RIOT_API_KEY}`);
    const summonerData = await summonerResponse.json();

    const activeGameResponse = await fetch(`https://${channelConfig.LOL_REGION}1.api.riotgames.com/lol/spectator/v4/active-games/by-summoner/${summonerData.id}?api_key=${RIOT_API_KEY}`);
    const activeGameData = await activeGameResponse.json();

    if (!activeGameData.participants) {
      client.say(channel, 'Oyuncu şuan da maçta değil.');
      return;
    }

    const ranks = { "UNRANKED": 0, "IRON IV": 1, "IRON III": 2, "IRON II": 3, "IRON I": 4, "BRONZE IV": 5, "BRONZE III": 6, "BRONZE II": 7, "BRONZE I": 8, "SILVER IV": 9, "SILVER III": 10, "SILVER II": 11, "SILVER I": 12, "GOLD IV": 13, "GOLD III": 14, "GOLD II": 15, "GOLD I": 16, "PLATINUM IV": 17, "PLATINUM III": 18, "PLATINUM II": 19, "PLATINUM I": 20, "EMERALD IV": 21, "EMERALD III": 22, "EMERALD II": 23, "EMERALD I": 24, "DIAMOND IV": 25, "DIAMOND III": 26, "DIAMOND II": 27, "DIAMOND I": 28, "MASTER": 29, "GRANDMASTER": 30, "CHALLENGER": 31 };
    const rankGroups = {};

    await Promise.all(activeGameData.participants.map(async participant => {
      const summonerId = participant.summonerId;

      const leagueResponse = await fetch(`https://${channelConfig.LOL_REGION}` + `1.api.riotgames.com/lol/league/v4/entries/by-summoner/${summonerId}?api_key=${RIOT_API_KEY}`);
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

    client.say(channel, `${sortedOutput}`);
  } catch (error) {
    client.say(channel, 'Eşleşme verileri alınamadı.');
    if (error.response) {
      console.error('API Hata Durumu:', error.response.status);
      console.error('API Hata Mesajı:', error.response.data);
    } else {
      console.error('İstek gönderilirken bir hata oluştu:', error.message);
    }
  }
}

// LOL WinRate
async function FLolwinrate(channel) {

  const channelConfig = channelConfigs[channel.slice(1).toLowerCase()];

  try {
    if (channelConfig.LOL_SUMMONER_NAME === "") {
      client.say(channel, "Önce bir LOL oyuncusu ayarlamalısınız. Kullanım: !lolsummoner <oyuncu_adı>");
      return;
    }

    const summonerResponse = await axios.get(`https://${channelConfig.LOL_REGION}1.api.riotgames.com/lol/summoner/v4/summoners/by-name/${channelConfig.LOL_SUMMONER_NAME}?api_key=${RIOT_API_KEY}`);
    const leagueResponse = await axios.get(`https://${channelConfig.LOL_REGION}1.api.riotgames.com/lol/league/v4/entries/by-summoner/${summonerResponse.data.id}?api_key=${RIOT_API_KEY}`);

    const rankedSoloData = leagueResponse.data.find((entry) => entry.queueType === 'RANKED_SOLO_5x5');

    if (rankedSoloData) {
      const wins = rankedSoloData.wins;
      const losses = rankedSoloData.losses;
      const winRate = (wins / (wins + losses)) * 100;

      client.say(channel, `${channelConfig.LOL_SUMMONER_NAME} • SoloQ Wr: ${wins}W ${losses}L ${winRate.toFixed(2)}%`);
    } else {
      client.say(channel, `${channelConfig.LOL_SUMMONER_NAME} • SoloQ maç geçmişi bulunamadı.`);
    }
  } catch (error) {
    client.say(channel, 'Maç verileri alınamadı.');
    if (error.response) {
      console.error('API Hata Durumu:', error.response.status);
      console.error('API Hata Mesajı:', error.response.data);
    } else {
      console.error('İstek gönderilirken bir hata oluştu:', error.message);
    }
  }
}

// LOL Average
async function FLolavg(channel) {

  const channelConfig = channelConfigs[channel.slice(1).toLowerCase()];

  try {
    if (channelConfig.LOL_SUMMONER_NAME === "") {
      client.say(channel, "Önce bir LOL oyuncusu ayarlamalısınız. Kullanım: !lolsummoner <oyuncu_adı>");
      return;
    }

    const summonerResponse = await fetch(`https://${channelConfig.LOL_REGION}1.api.riotgames.com/lol/summoner/v4/summoners/by-name/${encodeURIComponent(channelConfig.LOL_SUMMONER_NAME)}?api_key=${RIOT_API_KEY}`);
    const summonerData = await summonerResponse.json();

    const activeGameResponse = await fetch(`https://${channelConfig.LOL_REGION}1.api.riotgames.com/lol/spectator/v4/active-games/by-summoner/${summonerData.id}?api_key=${RIOT_API_KEY}`);
    const activeGameData = await activeGameResponse.json();

    if (!activeGameData.participants) {
      client.say(channel, 'Oyuncu şuan da maçta değil.');
      return;
    }

    const ranks = { "UNRANKED": 0, "IRON IV": 1, "IRON III": 2, "IRON II": 3, "IRON I": 4, "BRONZE IV": 5, "BRONZE III": 6, "BRONZE II": 7, "BRONZE I": 8, "SILVER IV": 9, "SILVER III": 10, "SILVER II": 11, "SILVER I": 12, "GOLD IV": 13, "GOLD III": 14, "GOLD II": 15, "GOLD I": 16, "PLATINUM IV": 17, "PLATINUM III": 18, "PLATINUM II": 19, "PLATINUM I": 20, "EMERALD IV": 21, "EMERALD III": 22, "EMERALD II": 23, "EMERALD I": 24, "DIAMOND IV": 25, "DIAMOND III": 26, "DIAMOND II": 27, "DIAMOND I": 28, "MASTER I": 29, "GRANDMASTER I": 30, "CHALLENGER I": 31 };
    let totalRankValue = 0;
    let totalPlayers = 0;

    await Promise.all(activeGameData.participants.map(async participant => {
      const summonerId = participant.summonerId;

      const leagueResponse = await fetch(`https://${channelConfig.LOL_REGION}1.api.riotgames.com/lol/league/v4/entries/by-summoner/${summonerId}?api_key=${RIOT_API_KEY}`);
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
    console.log(totalRankValue)
    console.log(totalPlayers)
    console.log(averageRankValue)
    if (averageRankValue > 31) averageRankValue = 31;
    else if (averageRankValue < 0) averageRankValue = 0;

    let averageRankName = 'Bilinmeyen Rank';
    for (const rank in ranks) if (ranks[rank] === averageRankValue) averageRankName = rank;

    client.say(channel, `Rank Ortalaması: ${averageRankName}`);
  } catch (error) {
    client.say(channel, 'Eşleşme verileri alınamadı.');
    if (error.response) {
      console.error('API Hata Durumu:', error.response.status);
      console.error('API Hata Mesajı:', error.response.data);
    } else {
      console.error('İstek gönderilirken bir hata oluştu:', error.message);
    }
  }
}
