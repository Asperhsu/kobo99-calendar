const cheerio = require('cheerio');
const dayjs = require('dayjs');
const md5 = require('md5');

export default class {
    async fetchBooks() {
        let articles = await this.findArticles();
        let url = articles.length ? articles[0].link : null;
        if (!url) return [];

        return await this.findArticleBooks(url);
    }

    async findArticles() {
        let url = 'https://www.kobo.com/zh/blog';
        let html = await this.fetch(url);

        const $ = cheerio.load(html);
        return $('.card:has(.card__title:contains("一週99"))').map((i, el) => {
            return {
                link: $(el).find('a.card__link').attr('href'),
                title: $(el).find('.card__title').text().trim(),
            }
        }).toArray();
    }

    async findArticleBooks(url) {
        let html = await this.fetch(url);
        const $ = cheerio.load(html);
        const books = [];

        $('.content-block p:contains("選書")').map((i, el) => {
            let date = this.parseDateFromTitle($(el).text());
            if (!date) return;

            let $link = $(el).find('a:first');
            let bookLink = $link.attr('href');
            if (!bookLink) return;

            let id = md5(bookLink);
            if (books.find(book => book.id === id)) return;

            books.push({
                id: id,
                date: date.unix(),
                title: this.stripBrackets($link.text()),
                description: this.formatsDescription($, bookLink, url),
            });
        });

        return books;
    }

    async fetch(url) {
        const response = await fetch(url, {
            cf: {
                cacheTtl: 300,
                cacheEverything: true,
            },
            headers: {
                'Accept': 'text/html',
                'Host': 'www.kobo.com',
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/98.0.4758.102 Safari/537.36 Edg/98.0.1108.55',
            },
        });
        return await response.text();
    }

    parseDateFromTitle(title) {
        var re = new RegExp('^([0-9]{1,2}\/[0-9]{1,2}).+選書');
        try {
            let found = title.match(re);
            if (!found) return null;

            let [month, day] = found[1].split('/');
            let date = dayjs().startOf('day').month(month - 1).date(day);
            return date;
        } catch (err) {
            return null;
        }
    }

    stripBrackets(text, prefix="《", suffix="》") {
        if (text.startsWith(prefix)) {
            text = text.substr(prefix.length);
        }
        if (text.endsWith(suffix)) {
            text = text.substr(0, text.length - suffix.length);
        }
        return text;
    }

    formatsDescription($, bookLink, blogUrl) {
        let $block = $(`article .book-block:has(a[href="${bookLink}"])`);
        if (!$block.length) return "";

        const descs = [];

        // title
        let title = $block.find('span.title').text().trim();
        if (title) {
            title = this.stripBrackets(title);
            descs.push(`<div><a href="${bookLink}">${title}</a></div>`)
        }

        // author
        let author = $block.find('span.author').html();
        if (author) {
            descs.push('<div>' + author + '</div>')
        }

        // other infomation (publisher, coupon...)
        $block.find('p').each(function (i, p) {
            descs.push('<div>' + $(p).html() + '</div>');
        })

        descs.push(`<div><a href="${blogUrl}">Kobo Blog</a></div>`);

        return descs.join('');
    }
}