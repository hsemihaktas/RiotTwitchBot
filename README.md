# Riot Twitch Chat Botu

## Açıklama:
Twitch yayıncılarının izleyicileri için özel olarak geliştirildi, oyun içi istatistiklerinizi hızlı ve kolay bir şekilde sohbette göndermeye yarar.

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
|!levels|Sihirdarların seviyelerini gösterir  

### TFT
|Komut|Açıklama|
|-|-|
|!tftsummoner Name|İstatiklerin çekileceği hesap ismi
|!tftregion TR|İstatiklerin çekileceği bölge
|!tftrank|Sihirdarın ligini gösterir
|!tftlastmatch / !tftlastgame|Sihirdarın son maç istatistiğini gösterir
|!tftavg|Sihirdarın son maçlardaki ortalamasını gösterir
|!tftitem / !bis Karakter|Şampiyonun yaygın eşya dizilimini gösterir
|!tftmeta|En Yaygın Kompu gösterir

## Özelleştirme
1. **RIOT_API_KEY**: Riot Games Developer Portal üzerinden oluşturmanız gereken bir Riot API anahtarıdır. Bu anahtarı edinmek için [developer.riotgames.com](https://developer.riotgames.com/) adresine gidin. Anahtarınızı aldıktan sonra, bu anahtarı koda eklemelisiniz.

2. **TFT_SUMMONER_NAME**: TFT için sihirdar adını belirtir. Kod üzerinden ayarlanır, ancak Twitch sohbeti üzerinden `!tftsummoner` komutunu kullanarak değiştirebilirler.

3. **TFT_REGION**: TFT için bölgeyi belirtir. Kod üzerinden ayarlanır, ancak Twitch sohbeti üzerinden `!tftregion` komutunu kullanarak değiştirebilirler.

4. **LOL_SUMMONER_NAME**: LOL için sihirdar adını belirtir. Kod üzerinden ayarlanır, ancak Twitch sohbeti üzerinden `!lolsummoner` komutunu kullanarak değiştirebilirler.

5. **LOL_REGION**: LOL için bölgeyi belirtir. Kod üzerinden ayarlanır, ancak Twitch sohbeti üzerinden `!lolregion` komutunu kullanarak değiştirebilirler.
https://developer.riotgames.com/docs/lol
> Oynadığınız sunucu Avrupa bölgesinde değilse, kodunuzdaki Europe API'lerini ilgili bölgeye uyarlamalısınız.

## Emeği Geçenler
[ByDexterTR](https://github.com/ByDexterTR)
[SemiH](https://github.com/hsemihaktas)
