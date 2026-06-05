import Bar from '@/app/Bar';
import Header from '@/app/Header';
import List from '@/app/search/List';
import { Suspense, use } from 'react';
import Loading from '@/app/search/loading';
import { search } from '@/lib/fetchDC';

export const dynamic = 'force-dynamic';

export default async function Page({ searchParams }) {
    const params = await searchParams;
    const word = params.word;
    const mode = params.mode;
    const promise = search(word, mode);

    return (
        <div>
            <Header />
            <Suspense fallback={<Loading />} key={word}>
                <Bar getting_word={word} />
                <Results promise={promise} />
            </Suspense>
        </div>
    );
}

function Results({ promise }) {
    const data = use(promise);
    return <List Params={data} />;
}
