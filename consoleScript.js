const diving = document.createElement('div');
const button = document.createElement('button');

button.textContent = 'DCcon Select';

Object.assign(diving.style, {
    position: 'fixed',
    right: '20px',
    bottom: '20px',
    zIndex: '2147483647',
});

Object.assign(button.style, {
    padding: '8px 14px',
    cursor: 'pointer',
});

diving.appendChild(button);

document.querySelector('[class^="base"]').appendChild(diving);

function createFloatingIframe(url) {
    document.getElementById('floating-iframe-overlay')?.remove();

    const overlay = document.createElement('div');
    overlay.id = 'floating-iframe-overlay';

    Object.assign(overlay.style, {
        position: 'fixed',
        inset: '0',
        zIndex: '2147483647',
        background: 'transparent',
        pointerEvents: 'auto',
    });

    const iframe = document.createElement('iframe');

    iframe.src = url;
    iframe.title = 'Floating iframe';
    iframe.allowTransparency = true;

    Object.assign(iframe.style, {
        position: 'absolute',

        right: '20px',
        bottom: '20px',

        width: 'min(480px, calc(100vw - 40px))',
        height: 'min(520px, calc(100vh - 40px))',

        border: 'none',
        borderRadius: '12px',
        background: 'transparent',

        boxShadow: '0 8px 28px rgba(0, 0, 0, 0.35)',
        pointerEvents: 'auto',
    });

    function close() {
        document.removeEventListener('keydown', handleKeydown);
        overlay.remove();
    }

    function handleKeydown(event) {
        if (event.key === 'Escape') {
            close();
        }
    }

    overlay.addEventListener('click', (event) => {
        if (event.target === overlay) {
            close();
        }
    });

    document.addEventListener('keydown', handleKeydown);

    overlay.append(iframe);
    document.body.append(overlay);
    return iframe;
}

async function getMyUserId() {
    const accountButton = document.querySelector('[class^="accountPopoutButtonWrapper"]');

    if (!accountButton) {
        throw new Error('계정 메뉴 버튼을 찾지 못했습니다.');
    }

    accountButton.click();

    const menuItems = await new Promise((resolve, reject) => {
        const findMenuItems = () => document.querySelectorAll('[class^="menuItemContent"]');

        const existingItems = findMenuItems();

        if (existingItems.length > 0) {
            resolve(existingItems);
            return;
        }

        const observer = new MutationObserver(() => {
            const items = findMenuItems();

            if (items.length === 0) {
                return;
            }

            clearTimeout(timeout);
            observer.disconnect();
            resolve(items);
        });

        const timeout = setTimeout(() => {
            observer.disconnect();
            reject(new Error('계정 메뉴가 열리지 않았습니다.'));
        }, 3000);

        observer.observe(document.body, {
            childList: true,
            subtree: true,
        });
    });

    const copyIdButton = menuItems[menuItems.length - 1];

    if (!copyIdButton) {
        throw new Error('ID 복사 메뉴를 찾지 못했습니다.');
    }

    copyIdButton.click();

    // 네이티브 클립보드에 반영될 시간을 조금 기다림
    await new Promise((resolve) => setTimeout(resolve, 50));

    const clipboardValue = await Promise.resolve(window.DiscordNative.clipboard.read());

    const userId = String(clipboardValue ?? '').trim();

    if (!/^\d{17,20}$/.test(userId)) {
        throw new Error(`클립보드 값이 Discord 사용자 ID가 아닙니다: ${userId}`);
    }

    return userId;
}

button.onclick = async () => {
    const iframe = createFloatingIframe('https://localhost:17384/inapp');

    const userId = await getMyUserId();

    const chatList = document.querySelectorAll('[class^="messageListItem"]');

    const lastChat = chatList[chatList.length - 1];

    if (!lastChat) {
        console.error('현재 화면에 메시지가 없음');
        return;
    }

    const match = lastChat.id.match(/^chat-messages-(\d+)-(\d+)$/);

    if (!match) {
        console.error('메시지 ID 형식이 예상과 다름:', lastChat.id);
        return;
    }

    const [, channelId, messageId] = match;

    function handleReady(event) {
        if (event.origin !== 'https://localhost:17384') {
            return;
        }

        if (event.source !== iframe.contentWindow) {
            return;
        }

        if (event.data?.type !== 'DCCON_READY') {
            return;
        }

        window.removeEventListener('message', handleReady);

        iframe.contentWindow.postMessage(
            {
                type: 'DCCON_CONTEXT',
                userId,
                channelId,
                messageId,
            },
            'https://localhost:17384',
        );
    }

    window.addEventListener('message', handleReady);
};
