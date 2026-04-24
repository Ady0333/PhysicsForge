export type WSMessage =
  | { type: "ready" }
  | {
      type: "frame";
      step: number;
      time: number;
      solveMs: number;
      grid: number[];
      n: number;
    };

type MessageHandler = (msg: WSMessage) => void;

class PhysicsWS {
  private ws: WebSocket | null = null;
  private handlers: MessageHandler[] = [];

  connect(url = "ws://localhost:8080") {
    this.ws = new WebSocket(url);

    this.ws.onopen = () => {
      console.log("[WS] connected");
      setTimeout(() => {
        this.send({ type: "init", resolution: 32, alpha: 0.1, dt: 0.01 });
      }, 100);
    };
    

    this.ws.onmessage = (e) => {
      const msg: WSMessage = JSON.parse(e.data);
      this.handlers.forEach((h) => h(msg));
    };

    this.ws.onerror = (e) => console.error("[WS] error", e);
    this.ws.onclose = () => console.log("[WS] disconnected");
  }

  send(data: object) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    }
  }

  onMessage(handler: MessageHandler) {
    this.handlers.push(handler);
    return () => {
      this.handlers = this.handlers.filter((h) => h !== handler);
    };
  }

  step() {
    this.send({ type: "step" });
  }
  reset() {
    this.send({ type: "reset" });
  }
  disconnect() {
    this.ws?.close();
  }
}

export const physicsWS = new PhysicsWS();
