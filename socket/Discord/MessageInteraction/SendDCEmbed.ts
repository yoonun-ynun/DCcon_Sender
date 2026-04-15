import { JSDOM } from 'jsdom';
import type { embed } from '../interfaces/Payloads.js';
import { createMessage } from '../AJAX.js';
import icoToPng from 'ico-to-png';

export async function embedSender(data: string, channel_id: string): Promise<void> {
    const link = data.match(/https:\/\/(gall|m)\.dcinside\.com\/[^\s]+(\/|no=)\d+/);
    if (link === null) {
        return;
    }
    console.log(`link: ${link[0]}`);
    let text: string;
    try {
        const res = await fetch(link[0]);
        text = await res.text();
    } catch (err: unknown) {
        console.log('error during fetching dcinside: ' + err);
        return;
    }
    if (text === '') return;

    const dom = new JSDOM(text);
    const title = dom.window.document.getElementsByName('twitter:title')[0].getAttribute('content');
    const description = dom.window.document
        .getElementsByName('twitter:description')[0]
        .getAttribute('content');
    const image = dom.window.document.getElementsByName('twitter:image')[0].getAttribute('content');
    const logo = dom.window.document
        .querySelector('link[rel="shortcut icon"]')
        ?.getAttribute('href');
    if (title && description && image && logo) {
        const image_res = await fetch(image);
        const image_file = new File([await image_res.blob()], 'image.png', { type: 'image/png' });
        const logo_res = await fetch(`https://${logo}`);
        const logo_buffer = await logo_res.arrayBuffer();
        const png_buffer = await icoToPng(Buffer.from(logo_buffer), 128);
        const png_logo = new File([new Uint8Array(png_buffer)], 'logo.png', { type: 'image/png' });

        const embed: embed = {
            title: title,
            description: description,
            type: 'link',
            url: link[0],
            thumbnail: { url: 'attachment://logo.png' },
            image: { url: 'attachment://image.png' },
            footer: {
                text: 'dcinside',
                icon_url: 'attachment://logo.png`',
            },
        };
        console.log(embed);
        await createMessage(channel_id, { embeds: [embed] }, [png_logo, image_file]);
    }
    return;
}
