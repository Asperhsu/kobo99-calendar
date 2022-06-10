/**
 * Welcome to Cloudflare Workers! This is your first scheduled worker.
 *
 * - Run `wrangler dev --local` in your terminal to start a development server
 * - Run `curl "http://localhost:8787/cdn-cgi/mf/scheduled"` to trigger the scheduled event
 * - Go back to the console to see what your worker has logged
 * - Update the Cron trigger in wrangler.toml (see https://developers.cloudflare.com/workers/wrangler/configuration/#triggers)
 * - Run `wrangler publish --name my-worker` to publish your worker
 *
 * Learn more at https://developers.cloudflare.com/workers/runtime-apis/scheduled-event/
 */

import GoogleCalendar from "./GoogleCalendar";
import KoboBooks from "./KoboBooks";
import dayjs from 'dayjs';

export default {
    async fetch(request, env, ctx) {
        var url = new URL(request.url);
        if (url.pathname !== '/') {
            return new Response(null, {
                status: 404,
                statusText: 'Not Found',
            });
        }

        await handler(env);
        return new Response('');
    },
    async scheduled(controller, env, ctx) {
        await handler(env);
    },
};

async function handler(env) {
    // get all books
    const koboService = new KoboBooks();

    console.log('fetch articles list');
    const articles = await koboService.findArticles();
    if (!articles.length || !articles[0].link) {
        console.warning('can not find article or article link');
        return;
    }

    let url = articles[0].link;
    console.log('find books in: ' + url)
    const books = await koboService.findArticleBooks(url);
    if (!books.length) {
        console.warning('no books');
        return;
    }
    console.log(`found ${books.length} books`);

    const googleService = new GoogleCalendar(env.GOOGLE_CLOUD_CREDENTIALS, env.CALENDAR_ID);

    // fetch events from books date range
    const events = await (async function (dates) {
        dates = dates.sort((a, b) => a - b);
        const eventRange = [dayjs.unix(dates.shift()), dayjs.unix(dates.pop())];

        console.log(`list events from ${eventRange[0].format('YYYY-MM-DD')} to ${eventRange[1].format('YYYY-MM-DD')}`);
        const events = await googleService.listEvents(eventRange[0].unix(), eventRange[1].unix());
        console.log(`${events.length} events exists`);

        return events;
    })(books.map(book => book.date));

    // check exists
    for (let book of books) {
        let event = events.find(event => {
            let id = event.extendedProperties && event.extendedProperties.shared && event.extendedProperties.shared.id;
            return id == book.id;
        });

        if (!event) {
            const data = await googleService.insertEvent(book);
            console.log('Event created: %s', data.summary);
        }
    }
}