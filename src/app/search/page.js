import Bar from '@/app/Bar';
import Header from '@/app/Header';
import List from '@/app/search/List';
import { Suspense } from 'react';
import Loading from '@/app/search/loading';
import { search } from '@/lib/fetchDC';

export const dynamic = 'force-dynamic';

export default async function Page({ searchParams }) {
    const params = await searchParams;
    const word = params.word ?? '';
    const mode = params.mode ?? '';

    return (
        <div>
            <Header />

            <Suspense fallback={<Loading />} key={`${word}:${mode}`}>
                <Bar getting_word={word} getting_mode={mode} />
                <Results word={word} mode={mode} />
            </Suspense>
        </div>
    );
}

async function Results({ word, mode }) {
    const data = await search(word, mode);
    return <List Params={data} />;
}
