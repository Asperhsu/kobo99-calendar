import { getAuthToken } from "web-auth-library/google";
import dayjs from 'dayjs';

export default class {
    token;

    constructor(credentials, calendarId) {
        this.credentials = credentials;
        this.calendarId = calendarId;
    }

    async getToken() {
        if (!this.token) {
            let token = await getAuthToken({
                credentials: this.credentials,
                scope: 'https://www.googleapis.com/auth/calendar',
            });
            this.token = token.accessToken;
        }
        return this.token;
    }

    // https://developers.google.com/calendar/api/v3/reference/events/list
    async listEvents(minTs, maxTs) {
        let timeMin = dayjs.unix(minTs).startOf('day').toISOString();
        let timeMax = dayjs.unix(maxTs).endOf('day').toISOString();

        let url = this.buildUrl('events', {
            timeMin,
            timeMax,
            singleEvents: true,
            orderBy: 'startTime',
        });

        let data = await this.fetch(url);
        return data.items || [];
    }

    // https://developers.google.com/calendar/api/v3/reference/events/insert
    async insertEvent(book) {
        let url = this.buildUrl('events');
        let date = dayjs.unix(book.date);

        const body = {
            summary: book.title,
            description: book.description,
            start: {
                date: date.format('YYYY-MM-DD'),
                timeZone: 'Asia/Taipei',
            },
            end: {
                date: date.add(1, 'day').format('YYYY-MM-DD'),
                timeZone: 'Asia/Taipei',
            },
            extendedProperties: {
                shared: {
                    id: book.id
                }
            }
        };

        return await this.fetch(url, {
            method: 'POST',
            body: JSON.stringify(body),
        });
    }

    buildUrl(path, query = {}) {
        let base = 'https://www.googleapis.com/calendar/v3/calendars/' + this.calendarId;
        let searchParams = (new URLSearchParams(query)).toString();
        let url = path ? base + '/' + path : base;
        if (searchParams) {
            url += '?' + searchParams;
        }

        return url;
    }

    async fetch(url, options = {}) {
        const init = Object.assign({}, {
            headers: {
                'content-type': 'application/json;charset=UTF-8',
                'Accept': 'application/json',
                'Authorization': 'Bearer ' + (await this.getToken()),
            },
        }, options);

        const response = await fetch(url, init);
        return await response.json();
    }
}