import { NextResponse } from 'next/server';

export async function POST(req) {
    const info = await req.json();
    console.log(info);
    const pkg_number = info.idx;
    const data = {};

    const body = new FormData();
    body.append('package_idx', pkg_number);

    const stream = await fetch('https://dccon.dcinside.com/index/package_detail', {
        method: 'POST',
        headers: {
            'x-requested-with': 'XMLHttpRequest',
            referer: 'https://dccon.dcinside.com/index/package_list',
        },
        body: body,
    });
    const res = await stream.json();
    data.title = res.info.title;
    data.description = res.info.description;
    data.main_img = `//dcimg5.dcinside.com/dccon.php?no=${res.info.main_img_path}`;
    data.idx = pkg_number;
    data.path = [];
    res.detail.forEach((item) => {
        data.path.push({ addr: `//dcimg5.dcinside.com/dccon.php?no=${item.path}`, ext: item.ext });
    });
    return NextResponse.json(data);
}
