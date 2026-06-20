/**
 * @name DCconSelector
 * @author yoonun
 * @description yoonun.com을 연동하여 디시콘을 선택하고 입력합니다.
 * @version 1.0.2
 */

module.exports = class DCconSelector {
    constructor() {
        this.iframeUrl = 'https://yoonun.com/inapp';
        this.button = null;
        this.overlay = null;
        this.iframeWindow = null;
        this.positionTracker = null;

        this.handleMessage = this.handleMessage.bind(this);
        this.handleKeydown = this.handleKeydown.bind(this);
        this.updatePosition = this.updatePosition.bind(this);
    }

    start() {
        this.createButton();
        window.addEventListener('message', this.handleMessage);
        this.positionTracker = setInterval(this.updatePosition, 500);
    }

    stop() {
        if (this.positionTracker) clearInterval(this.positionTracker);
        this.removeButton();
        this.closeIframe();
        window.removeEventListener('message', this.handleMessage);
    }

    createButton() {
        if (document.getElementById('dccon-select-btn')) return;

        this.button = document.createElement('button');
        this.button.id = 'dccon-select-btn';
        this.button.textContent = 'DCcon Select';

        Object.assign(this.button.style, {
            position: 'fixed',
            zIndex: '2147483647',
            padding: '4px 12px',
            cursor: 'pointer',
            backgroundColor: '#5865F2',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontWeight: 'bold',
            boxShadow: '0 4px 6px rgba(0,0,0,0.15)',
            fontSize: '14px',
            transition: 'background-color 0.2s',
            opacity: '0',
            pointerEvents: 'none',
        });

        this.button.onmouseover = () => {
            this.button.style.backgroundColor = '#4752C4';
        };
        this.button.onmouseout = () => {
            this.button.style.backgroundColor = '#5865F2';
        };
        this.button.onclick = () => this.openIframe();

        document.body.appendChild(this.button);
    }

    updatePosition() {
        if (!this.button) return;

        const form = document.querySelector('form');
        if (form) {
            const rect = form.getBoundingClientRect();

            const rightPos = window.innerWidth - rect.right + 16;
            const bottomPos = window.innerHeight - rect.top + 8;

            this.button.style.right = `${rightPos}px`;
            this.button.style.bottom = `${bottomPos}px`;

            this.button.style.opacity = '1';
            this.button.style.pointerEvents = 'auto';
        } else {
            this.button.style.opacity = '0';
            this.button.style.pointerEvents = 'none';
        }
    }

    removeButton() {
        const existingBtn = document.getElementById('dccon-select-btn');
        if (existingBtn) existingBtn.remove();
        this.button = null;
    }

    openIframe() {
        if (document.getElementById('floating-iframe-overlay')) return;

        this.overlay = document.createElement('div');
        this.overlay.id = 'floating-iframe-overlay';

        Object.assign(this.overlay.style, {
            position: 'fixed',
            inset: '0',
            zIndex: '2147483647',
            background: 'transparent',
            pointerEvents: 'auto',
        });

        const iframe = document.createElement('iframe');
        iframe.src = this.iframeUrl;
        iframe.title = 'Floating iframe';
        iframe.allowTransparency = true;

        let bottomPos = '80px';
        let rightPos = '20px';

        if (this.button) {
            const rect = this.button.getBoundingClientRect();
            bottomPos = `${window.innerHeight - rect.bottom}px`;
            rightPos = `${window.innerWidth - rect.right}px`;
        }

        Object.assign(iframe.style, {
            position: 'absolute',
            right: rightPos,
            bottom: bottomPos,
            width: 'min(480px, calc(100vw - 40px))',
            height: 'min(520px, calc(100vh - 40px))',
            border: 'none',
            borderRadius: '12px',
            background: 'transparent',
            boxShadow: '0 8px 28px rgba(0, 0, 0, 0.4)',
            pointerEvents: 'auto',
        });

        this.overlay.addEventListener('click', (event) => {
            if (event.target === this.overlay) this.closeIframe();
        });

        document.addEventListener('keydown', this.handleKeydown);

        this.overlay.append(iframe);
        document.body.append(this.overlay);

        this.iframeWindow = iframe.contentWindow;
    }

    closeIframe() {
        if (this.overlay) {
            this.overlay.remove();
            this.overlay = null;
            this.iframeWindow = null;
        }
        document.removeEventListener('keydown', this.handleKeydown);
    }

    handleKeydown(event) {
        if (event.key === 'Escape') {
            this.closeIframe();
        }
    }

    async getContextData() {
        let userId = null;
        try {
            const UserStore = BdApi.Webpack.getModule(
                (m) => typeof m?.getCurrentUser === 'function',
            );

            if (UserStore) {
                userId = UserStore.getCurrentUser()?.id;
            }
        } catch (e) {}

        const chatList = document.querySelectorAll('[class^="messageListItem"]');
        const lastChat = chatList[chatList.length - 1];

        let channelId = null;
        let messageId = null;

        if (lastChat) {
            const match = lastChat.id.match(/^chat-messages-(\d+)-(\d+)$/);
            if (match) {
                channelId = match[1];
                messageId = match[2];
            }
        }

        return { userId, channelId, messageId };
    }

    async handleMessage(event) {
        const expectedOrigin = new URL(this.iframeUrl).origin;

        if (event.origin !== expectedOrigin) {
            return;
        }

        if (event.data?.type === 'DCCON_READY') {
            const { userId, channelId, messageId } = await this.getContextData();

            if (!userId || !channelId) {
                if (BdApi.UI && typeof BdApi.UI.showToast === 'function') {
                    BdApi.UI.showToast('현재 채팅방 정보를 읽을 수 없습니다.', { type: 'error' });
                } else if (typeof BdApi.showToast === 'function') {
                    BdApi.showToast('현재 채팅방 정보를 읽을 수 없습니다.', { type: 'error' });
                }
                return;
            }

            this.iframeWindow.postMessage(
                {
                    type: 'DCCON_CONTEXT',
                    userId,
                    channelId,
                    messageId,
                },
                expectedOrigin,
            );
        }
    }
};
