'use client';
import './iframe.css';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { useEffect, useState } from 'react';
import { storeList } from '@/store/storeList.js';

export default function Button({ lists, title, idx, main }) {
    const [progress, setProgress] = useState(0);
    const [progress_max, setProgress_max] = useState(0);
    const [isMounted, setIsMounted] = useState(false);

    const isExist = storeList((s) => s.has(idx));
    const add = storeList((s) => s.add);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setIsMounted(true);
    }, []);

    async function handleZip() {
        const zip = new JSZip();

        setProgress(0);
        setProgress_max(lists.length);

        let done = 0;

        const files = await Promise.all(
            lists.map(async (item, i) => {
                try {
                    const response = await fetch(`/api/img?u=${encodeURIComponent(item.addr)}`, {
                        cache: 'force-cache',
                    });

                    if (!response.ok) return null;

                    const blob = await response.blob();
                    const ext =
                        item.ext ?? response.headers.get('content-type')?.split('/')[1] ?? 'png';

                    done += 1;
                    setProgress(done);

                    return {
                        name: `${i}.${ext}`,
                        blob,
                    };
                } catch (e) {
                    done += 1;
                    setProgress(done);
                    console.log(e);
                    return null;
                }
            }),
        );

        for (const file of files) {
            if (!file) continue;
            zip.file(file.name, file.blob);
        }

        const content = await zip.generateAsync({ type: 'blob' });
        saveAs(content, `${title}.zip`);
    }

    async function handleAdd() {
        try {
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

            {!isMounted && (
                <button className="btn_added" disabled>
                    확인 중...
                </button>
            )}

            {isMounted && isExist && (
                <button className="btn_added" disabled>
                    이미 추가되었습니다.
                </button>
            )}

            {isMounted && !isExist && (
                <button className="btn_add" onClick={handleAdd}>
                    추가
                </button>
            )}

            {progress > 0 && (
                <div id="progress">
                    <progress id="download_progress" max={progress_max} value={progress}></progress>
                </div>
            )}
        </div>
    );
}
