# Kobo 99 特價書日曆爬蟲
- 日曆公開網址: https://calendar.google.com/calendar/embed?src=rcmvnfej75s7c9sjdbic1f55v8%40group.calendar.google.com&ctz=Asia%2FTaipei
- iCal: https://calendar.google.com/calendar/ical/rcmvnfej75s7c9sjdbic1f55v8%40group.calendar.google.com/public/basic.ics

## 如何新增日曆
- 開啟 [Google 日曆](https://calendar.google.com/)
- 點選右上角 齒輪 > 設定
- 左側 一般 > 新增日曆 > 加入日曆網址
- 輸入 https://calendar.google.com/calendar/ical/rcmvnfej75s7c9sjdbic1f55v8%40group.calendar.google.com/public/basic.ics
- 點選 新增日曆

## 爬蟲動作
- 於 [Kobo Blog](https://www.kobo.com/zh/blog) 中尋找最新的一週99書單文章
- 尋找 "mm/dd週x選書" 文字，爬取 書本連結 與 書名
- 根據書本連結尋找對應的 .content-block 內的書本資訊
- 新增至 Google Calendar

### google oauth credentials
cat credentials.json | wrangler secret put GOOGLE_CLOUD_CREDENTIALS --env=production