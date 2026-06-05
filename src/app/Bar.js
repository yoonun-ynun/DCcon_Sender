'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Bar({ getting_word, getting_mode }) {
    const [word, setWord] = useState(getting_word || '');
    const [search, setSearch] = useState(getting_mode || 'title');
    const router = useRouter();
    const Blacklist = ['디시', '디시콘', '시콘'];

    function onKeyDown(event) {
        if (event.key === 'Enter') {
            event.preventDefault();
            Redirect();
        }
    }

    function Redirect() {
        if (word.length < 2) {
            alert('검색어를 2글자 이상으로 입력 해 주세요');
            return;
        }
        if (word.length > 50) {
            alert('최대 50자까지 입력 가능합니다.');
        }
        if (Blacklist.includes(word)) {
            alert('금지된 검색어 입니다.');
            return;
        }
        router.push(`/search?word=${encodeURIComponent(word)}&mode=${search}`);
    }

    return (
        <div id="Search">
            <div id="Search_bar">
                <select
                    className="search-select"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                >
                    <option value="title">이름</option>
                    <option value="tags">태그</option>
                </select>

                <div className="search-divider"></div>

                <input
                    className="bar"
                    placeholder="검색어를 입력하세요"
                    value={word}
                    onChange={(e) => setWord(e.target.value)}
                    onKeyDown={onKeyDown}
                />

                <a onClick={Redirect} style={{ display: 'flex' }}>
                    <button className="Search_bt" aria-label="Search">
                        <img src="/search.png" alt="검색하기" id="Search_image" />
                    </button>
                </a>
            </div>
        </div>
    );
}
