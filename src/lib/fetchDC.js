import { JSDOM } from 'jsdom';

export async function day_top() {
    const res = await fetch('https://json2.dcinside.com/json1/dccon_day_top100.php', {
        method: 'GET',
        headers: {
            referer: 'https://dccon.dcinside.com/',
        },
        next: { revalidate: 3600 },
    });
    const data = await res.text();
    let response = data.substring(1, data.length - 1); //JSONP to JSON
    response = JSON.parse(response);
    return response;
}

export async function week_top() {
    const res = await fetch('https://json2.dcinside.com/json1/dccon_week_top100.php', {
        method: 'GET',
        headers: {
            referer: 'https://dccon.dcinside.com/',
        },
        next: { revalidate: 3600 },
    });

    const data = await res.text();
    let response = data.substring(1, data.length - 1); //JSONP to JSON
    response = JSON.parse(response);
    return response;
}

export async function month_top() {
    const res = await fetch('https://json2.dcinside.com/json1/dccon_month_top100.php', {
        method: 'GET',
        headers: {
            referer: 'https://dccon.dcinside.com/',
        },
        next: { revalidate: 3600 },
    });

    const data = await res.text();
    let response = data.substring(1, data.length - 1); //JSONP to JSON
    response = JSON.parse(response);
    return response;
}

export async function search(text) {
    async function getSearch(word, page) {
        let result = await fetch(
            `https://dccon.dcinside.com/hot/${page}/title/${encodeURIComponent(word)}`,
            {
                method: 'GET',
                headers: {
                    referer: 'https://dccon.dcinside.com/',
                },
                next: { revalidate: 3600 },
            },
        );
        if (!result.ok) return undefined;
        result = await result.text();

        // JSDOM 파싱 결과를 바로 반환하도록 수정
        const dom = new JSDOM(result);

        // 검색 결과가 없는지 여기서 바로 확인
        if (dom.window.document.querySelector('.dccon_search_none')) {
            return { page, data: [], isNone: true }; // '검색 결과 없음' 플래그
        }

        const listNode = dom.window.document.querySelector('.dccon_shop_list');
        if (!listNode) return undefined;

        const isEnd = listNode?.childNodes.length === 1;

        const pageData = [];
        listNode?.childNodes.forEach((item) => {
            if (!item.data) {
                const data = {
                    title: item.querySelector('.dcon_name').innerHTML,
                    idx: item.getAttribute('package_idx'),
                    img: item.querySelector('.thumb_img').getAttribute('src'),
                };
                pageData.push(data);
            }
        });

        return { page, data: pageData, isEnd }; // 페이지 데이터와 마지막 페이지/검색 없음 여부 반환
    }

    let MAX_CONCURRENT_PAGES = 10; // 한 번에 검색할 최대 페이지 수

    const finalResult = [];

    let i = 1;
    while (true) {
        const pagePromises = [];
        // 1. 정해진 수만큼의 페이지 요청을 동시에 생성
        for (; i <= MAX_CONCURRENT_PAGES; i++) {
            pagePromises.push(getSearch(text, i));
        }

        let pageResults;
        try {
            // 2. 모든 요청이 완료될 때까지 병렬로 기다림
            pageResults = await Promise.all(pagePromises);
        } catch (err) {
            return [];
        }

        // '검색 결과 없음'이 한 번이라도 뜨면 즉시 빈 배열 반환
        if (pageResults.some((res) => res?.isNone)) {
            return [];
        }

        for (const res of pageResults) {
            if (!res) continue; // fetch 실패 등으로 undefined인 경우

            finalResult.push(...res.data);

            // '마지막 페이지' 플래그(isEnd)를 만나면
            // 그 뒤 페이지들은 어차피 빈 페이지일 것이므로 취합을 중단.
            if (res.isEnd) {
                return finalResult; // 취합된 최종 결과 반환
            }
        }
        MAX_CONCURRENT_PAGES += 10;
    }
}

export async function dccon_info(pkg_number) {
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

    return data;
}
