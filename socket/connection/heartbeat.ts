import WebSocket from 'ws';
import { Opcode } from './Message.js';

let sequence: null | number = null;
let timeout: null | NodeJS.Timeout = null;
let lastAck = true;

export function sendHeartbeat(socket: WebSocket, Interval: number, onTimeout: () => void) {
    try {
        stopHeartbeat();
        lastAck = true;
        console.log('Start heartbeat with interval', Interval);
        function send() {
            if (socket.readyState === 1) {
                if (!lastAck) {
                    console.log("Don't Receive Ack");
                    onTimeout();
                    return;
                }
                console.log('Sending Heartbeat');
                socket.send(
                    JSON.stringify({
                        op: Opcode.HEARTBEAT,
                        d: sequence,
                    }),
                );
                lastAck = false;
            } else {
                console.log('socket is not open');
                onTimeout();
                return;
            }
            timeout = setTimeout(send, Interval);
        }
        send();
    } catch (e: unknown) {
        console.error('Heartbeat loop crashed:', e);
        onTimeout();
    }
}

export function sendSocket(socket: WebSocket) {
    if (socket.readyState !== WebSocket.OPEN) return;

    console.log('Sending Heartbeat');
    socket.send(
        JSON.stringify({
            op: Opcode.HEARTBEAT,
            d: sequence,
        }),
    );
    lastAck = false;
}

export function setAck() {
    lastAck = true;
}

export function stopHeartbeat() {
    if (timeout) {
        clearTimeout(timeout);
        console.log('Stop heartbeat');
        timeout = null;
    }
}

export function setSequence(s: number) {
    sequence = s;
}

export function getSequence() {
    return sequence;
}
