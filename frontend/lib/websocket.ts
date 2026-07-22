import { TrustUpdateEvent, LiveFeedEvent } from '@/types';
import { useEffect } from 'react';

type EventHandler<T> = (data: T) => void;

class WebSocketClient {
  private ws: WebSocket | null = null;
  private url: string = '';
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  
  private trustHandlers: EventHandler<TrustUpdateEvent>[] = [];
  private liveHandlers: EventHandler<LiveFeedEvent>[] = [];
  private genericHandlers: EventHandler<unknown>[] = [];

  connect(url: string) {
    if (this.ws?.readyState === WebSocket.OPEN) return;
    this.url = url;
    this.ws = new WebSocket(url);

    this.ws.onopen = () => {
      this.reconnectAttempts = 0;
      console.log('WS connected');
    };

    this.ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        this.genericHandlers.forEach(h => h(data));
        
        if (data.event_type && data.event_type.startsWith('trust_')) {
          this.trustHandlers.forEach(h => h(data));
        } else {
          this.liveHandlers.forEach(h => h(data));
        }
      } catch (e) {
        console.error('WS parse error', e);
      }
    };

    this.ws.onclose = () => {
      if (this.reconnectAttempts < this.maxReconnectAttempts) {
        const backoff = Math.pow(2, this.reconnectAttempts) * 1000;
        setTimeout(() => this.connect(this.url), backoff);
        this.reconnectAttempts++;
      }
    };
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  onTrustUpdate(callback: EventHandler<TrustUpdateEvent>) {
    this.trustHandlers.push(callback);
    return () => {
      this.trustHandlers = this.trustHandlers.filter(h => h !== callback);
    };
  }

  onLiveEvent(callback: EventHandler<LiveFeedEvent>) {
    this.liveHandlers.push(callback);
    return () => {
      this.liveHandlers = this.liveHandlers.filter(h => h !== callback);
    };
  }

  onMessage(callback: EventHandler<unknown>) {
    this.genericHandlers.push(callback);
    return () => {
      this.genericHandlers = this.genericHandlers.filter(h => h !== callback);
    };
  }
}

export const wsClient = new WebSocketClient();

export function useWebSocket() {
  useEffect(() => {
    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000/ws';
    wsClient.connect(wsUrl);
    return () => {
      wsClient.disconnect();
    };
  }, []);
}
