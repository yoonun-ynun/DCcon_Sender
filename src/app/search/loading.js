export default function Loading() {
    return (
        <div className="loading-container">
            <div style={{ marginBottom: '1rem' }}>
                <svg
                    width="40"
                    height="40"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                    stroke="#a855f7"
                    className="animate-spin"
                >
                    <style>{`
                        .animate-spin { animation: spin 2s linear infinite; }
                        @keyframes spin { 100% { transform: rotate(360deg); } }
                    `}</style>
                    <g fill="none" fillRule="evenodd">
                        <g transform="translate(1 1)" strokeWidth="2">
                            <circle strokeOpacity=".2" cx="11" cy="11" r="11" />
                            <path d="M22 11c0-6.075-4.925-11-11-11">
                                <animateTransform
                                    attributeName="transform"
                                    type="rotate"
                                    from="0 11 11"
                                    to="360 11 11"
                                    dur="1s"
                                    repeatCount="indefinite"
                                />
                            </path>
                        </g>
                    </g>
                </svg>
            </div>
            <div>Now Searching...</div>
        </div>
    );
}
