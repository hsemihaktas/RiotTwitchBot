# Riot Twitch Chat Botu

## Açıklama:
Node.js axios kütüphanesi ile riot api kullanılarak twitch izleyicilerin oyun içi istatikleri görmesi için geliştirilmiş kendinize ait bir twitch chat botu.

## Komutlar:

### Genel
|Komut|Açıklama|
|-|-|
|!commands/!help|Komut listesini gösterir

### LOL
|Komut|Açıklama|
|-|-|
|!lolsummoner Name|İstatiklerin çekileceği hesap ismi
|!lolregion TR|İstatiklerin çekileceği bölge
|!lolrank|Sihirdarın ligini gösterir
|!lollastmatch/!lastgame|Sihirdarın son maç istatistiğini gösterir
|!runes|Sihirdarın rünleri gösterir
|!matchup|Sihirdarların liglerini gösterir
|!winrate/!wr|Sihirdarın SoloQ kazanma oranını gösterir
|!avgrank/!elo|Sihirdarların lig ortalamasını gösterir
|!mostplayed|Sihirdarın favori şampiyonunu gösterir
|!streak|Sihirdarın kaç maçtır yenilmediğini gösterir

### TFT
|Komut|Açıklama|
|-|-|
|!tftsummoner Name|İstatiklerin çekileceği hesap ismi
|!tftregion TR|İstatiklerin çekileceği bölge
|!tftrank|Sihirdarın ligini gösterir
|!tftlastmatch|Sihirdarın son maç istatistiğini gösterir
|!tftavg|Sihirdarın son maçlardaki ortalamasını gösterir

## Özelleştirme
**RIOT_API_KEY** https://developer.riotgames.com/ üzerinden riot api anahtarını oluşturup girmeniz lazım.

**TFT_SUMMONER_NAME** kod içerisinden veya !tftsummoner komutu ile değiştirmelisiniz.
**TFT_REGION** kod içerisinden veya !tftregion komutu ile değiştirmelisiniz.

**LOL_SUMMONER_NAME** kod içerisinden veya !lolsummoner komutu ile değiştirmelisiniz.
**LOL_REGION** kod içerisinden veya !lolregion komutu ile değiştirmelisiniz.
https://developer.riotgames.com/docs/lol
> Eğer oynadığınız sunucu europe bölgesinde değil ise kod içerisinden europe apilerini düzeltmelisiniz.

## Emeği Geçenler
[ByDexterTR](https://github.com/ByDexterTR)
[hsemihaktas](https://github.com/hsemihaktas)