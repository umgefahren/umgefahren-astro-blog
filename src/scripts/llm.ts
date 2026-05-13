import {
  CreateServiceWorkerMLCEngine,
  ServiceWorkerMLCEngine,
  type ChatCompletionChunk,
  type ChatCompletionMessageParam,
  type InitProgressCallback,
} from "@mlc-ai/web-llm";

type SupportedModel = "Llama-3.1-8B-Instruct-q4f32_1-MLC";

class LazyDict<K, V> {
  private dict: Map<K, V> = new Map();

  async get(key: K, callback: () => Promise<V>): Promise<V> {
    if (!this.dict.has(key)) {
      this.dict.set(key, await callback());
    }
    return this.dict.get(key)!;
  }
}

const modelToEngine = new LazyDict<SupportedModel, ServiceWorkerMLCEngine>();

export class LlmHandler {
  private _engine: ServiceWorkerMLCEngine;
  private model: SupportedModel;

  private constructor(engine: ServiceWorkerMLCEngine, model: SupportedModel) {
    this._engine = engine;
    this.model = model;
  }

  public static async createLlmEngine(
    model: SupportedModel,
    callback?: InitProgressCallback,
  ): Promise<LlmHandler> {
    const engine = await modelToEngine.get(model, async () => {
      return await CreateServiceWorkerMLCEngine(model, {
        initProgressCallback: callback,
      });
    });
    return new LlmHandler(engine, model);
  }

  public conversation(system: string): LlmConversation {
    return LlmConversation._deriveConversation(this, system);
  }

  public get engine(): ServiceWorkerMLCEngine {
    return this._engine;
  }
}

export enum Role {
  System,
  User,
  Assistant,
}

export interface Message {
  role: Role;
  content: string;
}

export class LlmConversation {
  private handler: LlmHandler;
  private history: Message[] = [];

  private constructor(handler: LlmHandler, system: string) {
    this.handler = handler;
    this.history = [{ role: Role.System, content: system }];
  }

  public static _deriveConversation(
    handler: LlmHandler,
    system: string,
  ): LlmConversation {
    return new LlmConversation(handler, system);
  }

  private userMessage(content: string) {
    this.history.push({ role: Role.User, content });
  }

  private assistantMessage(content: string) {
    this.history.push({ role: Role.Assistant, content });
  }

  private get llmMessages(): ChatCompletionMessageParam[] {
    return this.history.map(({ role, content }) => {
      switch (role) {
        case Role.System:
          return { role: "system", content };
        case Role.User:
          return { role: "user", content };
        case Role.Assistant:
          return { role: "assistant", content };
      }
    });
  }

  public async *next(userMessage: string): AsyncIterable<ChatCompletionChunk> {
    this.userMessage(userMessage);
    const chunks = await this.handler.engine.chat.completions.create({
      messages: this.llmMessages,
      temperature: 1,
      stream: true,
      stream_options: {
        include_usage: true,
      },
    });
    for await (const chunk of chunks) {
      yield chunk;
    }
    this.assistantMessage(await this.handler.engine.getMessage());
  }
}
