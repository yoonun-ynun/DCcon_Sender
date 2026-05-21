import './iframe.css';
import Button from '@/app/components/info/Button';
import { dccon_info } from '@/lib/fetchDC';
import Image from './Image.js';

export default async function Page({ searchParams }) {
    const params = await searchParams;
    const idx = params.idx;
    const data = await dccon_info(idx);

    return (
        <div id={'class_doc'}>
            <div id={'main'}>
                <img
                    src={`/api/img?u=${encodeURIComponent(data.main_img)}`}
                    alt={'main image'}
                    className={'dccon_img'}
                    id={'main-img'}
                    decoding={'sync'}
                    width={200}
                    height={200}
                />
                <div className={'info_wrap'}>
                    <div className={'text_field'}>
                        <span className={'title_field'}>{data.title}</span>
                        <br />
                        <span id={'description'}>{data.description}</span>
                    </div>
                    <Button lists={data.path} title={data.title} idx={idx} main={data.main_img} />
                </div>
            </div>
            <hr />
            <div className={'image_list'}>
                {data.path.map((item, i) => {
                    return (
                        <Image
                            src={`/api/img?u=${encodeURIComponent(item.addr)}`}
                            alt={'path image'}
                            key={i}
                            width={200}
                            height={200}
                        />
                    );
                })}
            </div>
        </div>
    );
}
