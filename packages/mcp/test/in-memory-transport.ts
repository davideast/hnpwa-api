import { Transport } from "@modelcontextprotocol/sdk/shared/transport.js";
import { JSONRPCMessage } from "@modelcontextprotocol/sdk/types.js";
import { EventEmitter } from "events";

export class InMemoryTransport implements Transport {
  private _other!: InMemoryTransport;
  private _emitter = new EventEmitter();

  constructor() {}

  public static createLinkedPair(): [InMemoryTransport, InMemoryTransport] {
    const a = new InMemoryTransport();
    const b = new InMemoryTransport();
    a._other = b;
    b._other = a;
    return [a, b];
  }

  async start(): Promise<void> {
    // No-op
  }

  async send(message: JSONRPCMessage): Promise<void> {
    this._other.receive(message);
  }

  receive(message: JSONRPCMessage) {
      if (this.onmessage) {
          this.onmessage(message);
      }
  }

  async close(): Promise<void> {
    this._emitter.removeAllListeners();
    if (this.onclose) {
        this.onclose();
    }
  }

  onclose?: () => void;
  onerror?: (error: Error) => void;
  onmessage?: (message: JSONRPCMessage) => void;
}
