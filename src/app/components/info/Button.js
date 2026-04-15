'use client';
import './iframe.css';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { useEffect, useState } from 'react';
import { storeList } from '@/store/storeList.js';

export default function Button({ lists, title, idx, main }) {
    const [progress, setProgress] = useState(0);
    const [progress_max, setProgress_max] = useState(0);
    const [isExist, setIsExist] = useState(null);
    const add = storeList((s) => s.add);
    const has = storeList((s) => s.has);
    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        if (has(idx)) setIsExist(true);
        else {
            setIsExist(false);
        }
    }, [idx]);
    async function handleZip() {
        const zip = new JSZip();
        setProgress_max(lists.length);

        for (let i = 0; i < lists.length; i++) {
            const response = await fetch(`/api/img?u=${encodeURIComponent(lists[i].addr)}`);
            if (!response.ok) continue;
            const blob = await response.blob();

            if (response.headers.get('content-Type')) {
                zip.file(`${i}.${lists[i].ext}`, blob);
            } else {
                zip.file(`${i}.png`, blob);
            }
            setProgress(i + 1);
        }
        const content = await zip.generateAsync({ type: 'blob' });

        saveAs(content, `${title}.zip`);
    }
    async function handleAdd() {
        try {
            const result = await fetch('/api/controller', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ idx: idx }),
            });
            const parsed = await result.json();
            if (!parsed.success) {
                alert(parsed.message);
                return;
            }
            setIsExist(true);
            add(idx, title, main);
        } catch (err) {
            alert('디시콘 추가 도중 오류가 발생하였습니다.');
            console.error(err);
        }
    }

    return (
        <div className="button_group">
            <button className="btn_download" onClick={handleZip}>
                다운로드
            </button>
            {isExist === null && (
                <button className="btn_added" disabled>
                    확인 중...
                </button>
            )}

            {isExist === true && (
                <button className="btn_added" disabled>
                    이미 추가되었습니다.
                </button>
            )}

            {isExist === false && (
                <button className="btn_add" onClick={handleAdd}>
                    추가
                </button>
            )}

            {progress > 0 && (
                <div id={'progress'}>
                    <progress
                        id={'download_progress'}
                        max={progress_max}
                        value={progress}
                    ></progress>
                </div>
            )}
        </div>
    );
}
