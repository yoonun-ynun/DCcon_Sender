import PipReady from './PipReady.js';
import styles from './loading.module.css';

export default function Loading() {
    return (
        <main className={styles.loading} role="status" aria-live="polite">
            <PipReady />
            <span className={styles.spinner} aria-hidden="true" />
            <p className={styles.label}>디시콘 목록을 준비하는 중</p>
        </main>
    );
}
