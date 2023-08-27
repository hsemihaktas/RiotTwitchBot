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
|!lollastmatch / !lollastgame|Sihirdarın son maç istatistiğini gösterir
|!runes|Sihirdarın rünleri gösterir
|!matchup|Sihirdarların liglerini gösterir
|!winrate / !wr|Sihirdarın SoloQ kazanma oranını gösterir
|!avgrank / !elo|Sihirdarların lig ortalamasını gösterir
|!mostplayed|Sihirdarın favori şampiyonunu gösterir
|!streak|Sihirdarın kaç maçtır yenilmediğini gösterir
|!mastery|Sihirdarların şampiyon ustalıklarını gösterir

### TFT
|Komut|Açıklama|
|-|-|
|!tftsummoner Name|İstatiklerin çekileceği hesap ismi
|!tftregion TR|İstatiklerin çekileceği bölge
|!tftrank|Sihirdarın ligini gösterir
|!tftlastmatch / !tftlastgame|Sihirdarın son maç istatistiğini gösterir
|!tftavg|Sihirdarın son maçlardaki ortalamasını gösterir
|!tftitem / !bis|Şampiyonun yaygın eşya dizilimini gösterir

## Özelleştirme
**RIOT_API_KEY** https://developer.riotgames.com/ üzerinden riot api anahtarını oluşturup girmeniz lazım.

**TFT_SUMMONER_NAME** değişkenini varsayılan olarak ayarlamalısınız, !tftsummoner komutu ile twitch chatinden değiştirebilirsiniz.
**TFT_REGION** değişkenini varsayılan olarak ayarlamalısınız, !tftregion komutu ile twitch chatinden değiştirebilirsiniz.

**LOL_SUMMONER_NAME** değişkenini varsayılan olarak ayarlamalısınız, !lolsummoner komutu ile twitch chatinden değiştirebilirsiniz.
**LOL_REGION** değişkenini varsayılan olarak ayarlamalısınız, !lolregion komutu ile twitch chatinden değiştirebilirsiniz.
https://developer.riotgames.com/docs/lol
> Eğer oynadığınız sunucu europe bölgesinde değil ise kod içerisinden europe apilerini düzeltmelisiniz.

## Emeği Geçenler
[ByDexterTR](https://github.com/ByDexterTR)

[Rewokun](https://github.com/rewokun)