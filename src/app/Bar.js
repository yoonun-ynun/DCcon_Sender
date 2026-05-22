'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Bar({ getting_word }) {
    const [word, setWord] = useState('');
    const router = useRouter();
    const Blacklist = ['디시', '디시콘'];

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        if (getting_word) setWord(getting_word);
    }, [getting_word]);

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
        router.push(`/search?word=${encodeURIComponent(word)}`);
    }

    return (
        <div id={'Search'}>
            <div id={'Search_bar'}>
                <input
                    className={'bar'}
                    value={word}
                    onChange={(e) => setWord(e.target.value)}
                    onKeyDown={onKeyDown}
                />
                <a onClick={Redirect} style={{ display: 'flex' }}>
                    <button className={'Search_bt'}>
                        <img src={'/search.png'} alt={'검색하기'} id={'Search_image'} />
                    </button>
                </a>
            </div>
        </div>
    );
}
