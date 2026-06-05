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
                        <div id={'description'}>{data.description}</div>
                    </div>
                    <Button lists={data.path} title={data.title} idx={idx} main={data.main_img} />
                </div>
            </div>

            <hr
                style={{
                    border: 'none',
                    height: '1px',
                    background: 'rgba(255,255,255,0.1)',
                    margin: '0 2rem',
                }}
            />

            <div className={'image_list'}>
                {data.path.map((item, i) => {
                    return (
                        <div className="premium-item-wrapper" key={i}>
                            <Image
                                src={`/api/img?u=${encodeURIComponent(item.addr)}`}
                                alt={'path image'}
                                width={200}
                                height={200}
                            />
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
