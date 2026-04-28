// @flow
/**
 * MiniMaxService - Cliente para integrar MiniMax 2.7 como proveedor de IA alternativo
 *
 * Utiliza el SDK de OpenAI compatible con la API de MiniMax
 */
import OpenAI from 'openai';
import {
  type AiRequest,
  type AiRequestMessage,
} from '../Utils/GDevelopServices/Generation';

// Configuración de MiniMax
const MINIMAX_API_BASE_URL = 'https://api.minimax.io/v1';
const MINIMAX_MODEL = 'MiniMax-M2.7';

// Identificador del preset de MiniMax
export const MINIMAX_PRESET_ID = 'minimax-m27-custom';

/**
 * Tipos para mensajes de MiniMax
 */
export type MiniMaxMessage = {
  role: 'system' | 'user' | 'assistant',
  content: string,
};

/**
 * Opciones para crear una respuesta de chat
 */
export type CreateMiniMaxChatOptions = {
  messages: Array<MiniMaxMessage>,
  apiKey: string,
  stream?: boolean,
  onChunk?: (content: string) => void,
};

/**
 * Resultado de una llamada a MiniMax
 */
export type MiniMaxChatResult = {
  content: string,
  reasoning?: string,
  finishReason: 'stop' | 'length' | 'content_filter',
};

/**
 * Cliente de MiniMax (singleton)
 */
let miniMaxClient: ?OpenAI = null;
let lastApiKey: ?string = null;

const getMiniMaxClient = (apiKey: string): OpenAI => {
  // Si la API key cambió, crear un nuevo cliente
  if (apiKey !== lastApiKey) {
    console.info('MiniMax API key changed, resetting client');
    miniMaxClient = null;
    lastApiKey = apiKey;
  }

  if (!miniMaxClient) {
    console.info('Creating new MiniMax client');
    miniMaxClient = new OpenAI({
      apiKey: apiKey,
      baseURL: MINIMAX_API_BASE_URL,
      dangerouslyAllowBrowser: true, // Necesario para uso en frontend
    });
  }
  return miniMaxClient;
};

/**
 * Convierte los mensajes del formato de GDevelop al formato de MiniMax
 */
export const formatMessagesForMiniMax = (
  output: ?Array<AiRequestMessage>,
  currentUserMessage: string
): Array<MiniMaxMessage> => {
  const messages: Array<MiniMaxMessage> = [];

  // Mensaje del sistema para dar contexto sobre GDevelop
  messages.push({
    role: 'system',
    content: `You are an AI assistant integrated in GDevelop, a game development engine. 
You help users create and modify games using natural language.
When suggesting game logic or events, consider that GDevelop uses a visual event-based system.
Be concise but helpful. If you need to clarify something, ask questions.`,
  });

  if (!output || output.length === 0) {
    // Primera mensagem - solo el mensaje del usuario
    messages.push({
      role: 'user',
      content: currentUserMessage,
    });
    return messages;
  }

  // Procesar mensajes existentes
  for (const message of output) {
    if (message.type === 'message' && message.role === 'user') {
      // Mensaje de usuario
      const contentArray = message.content;
      if (Array.isArray(contentArray)) {
        const textContent = contentArray
          .filter(item => item.type === 'user_request')
          .map(item => item.text)
          .join('\n');
        if (textContent) {
          messages.push({
            role: 'user',
            content: textContent,
          });
        }
      }
    } else if (message.type === 'message' && message.role === 'assistant') {
      // Mensaje del asistente
      const contentArray = message.content;
      if (Array.isArray(contentArray)) {
        const textContent = contentArray
          .filter(item => item.type === 'output_text')
          .map(item => item.text)
          .join('\n');
        if (textContent) {
          messages.push({
            role: 'assistant',
            content: textContent,
          });
        }
      }
    }
    // Ignorar function_call_output por ahora - no procesamos function calls en v1
  }

  // Añadir el mensaje actual del usuario
  if (currentUserMessage) {
    messages.push({
      role: 'user',
      content: currentUserMessage,
    });
  }

  return messages;
};

/**
 * Convierte la respuesta de MiniMax al formato de mensaje de GDevelop
 */
export const formatMiniMaxResponseForGDevelop = (
  response: MiniMaxChatResult,
  messageId: string
): AiRequestMessage => {
  const content: Array<any> = [];

  // Añadir reasoning si existe
  if (response.reasoning) {
    content.push({
      type: 'reasoning',
      status: 'completed',
      summary: {
        text: response.reasoning,
        type: 'summary_text',
      },
    });
  }

  // Añadir texto de respuesta
  content.push({
    type: 'output_text',
    status: 'completed',
    text: response.content,
    annotations: [],
  });

  return {
    type: 'message',
    status: 'completed',
    role: 'assistant',
    content,
    messageId,
  };
};

/**
 * Crea un ID único para el mensaje
 */
const generateMessageId = (): string => {
  return `minimax-${Date.now()}-${Math.random()
    .toString(36)
    .substr(2, 9)}`;
};

/**
 * Crea una solicitud de chat con MiniMax
 *
 * Esta función simula el comportamiento del backend de GDevelop:
 * - Crea un ID de request
 * - Hace la llamada a MiniMax
 * - Retorna una respuesta formateada
 */
export const createMiniMaxChat = async ({
  messages,
  apiKey,
  stream = false,
  onChunk,
}: CreateMiniMaxChatOptions): Promise<{
  request: AiRequest,
  assistantMessage: AiRequestMessage,
}> => {
  console.info('createMiniMaxChat called with:', {
    messageCount: messages?.length,
    hasApiKey: !!apiKey,
    stream,
  });

  const client = getMiniMaxClient(apiKey);
  const requestId = `minimax-${Date.now()}-${Math.random()
    .toString(36)
    .substr(2, 9)}`;
  const messageId = generateMessageId();

  try {
    let fullContent = '';

    console.info('Calling MiniMax API with model:', MINIMAX_MODEL);

    if (stream) {
      // Streaming response
      const streamResponse = await client.chat.completions.create({
        model: MINIMAX_MODEL,
        messages: messages,
        stream: true,
        stream_options: { include_usage: true },
      });

      for await (const chunk of streamResponse) {
        const delta = chunk.choices[0]?.delta?.content;
        if (delta) {
          fullContent += delta;
          if (onChunk) {
            onChunk(fullContent);
          }
        }
      }
    } else {
      // Response completo
      const response = await client.chat.completions.create({
        model: MINIMAX_MODEL,
        messages: messages,
        stream: false,
      });

      fullContent = response.choices[0]?.message?.content || '';
    }

    // Formatear la respuesta
    const assistantMessage = formatMiniMaxResponseForGDevelop(
      {
        content: fullContent,
        finishReason: 'stop',
      },
      messageId
    );

    // Crear un AiRequest simulado (local)
    const request: AiRequest = {
      id: requestId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      userId: 'local-minimax',
      status: 'ready',
      mode: 'chat',
      aiConfiguration: {
        presetId: MINIMAX_PRESET_ID,
      },
      error: null,
      output: [assistantMessage],
    };

    return {
      request,
      assistantMessage,
    };
  } catch (error) {
    console.error('Error calling MiniMax API:', error);

    // Re-lanzar el error para que el caller lo maneje
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`MiniMax API error: ${errorMessage}`);
  }
};

/**
 * Añade un mensaje a una conversación existente de MiniMax
 */
export const addMessageToMiniMaxChat = async ({
  currentOutput,
  userMessage,
  apiKey,
  requestId,
  stream = false,
  onChunk,
}: {
  currentOutput: ?Array<AiRequestMessage>,
  userMessage: string,
  apiKey: string,
  requestId: string,
  stream?: boolean,
  onChunk?: (content: string) => void,
}): Promise<{
  request: AiRequest,
  assistantMessage: AiRequestMessage,
}> => {
  // Convertir mensajes existentes + nuevo mensaje al formato de MiniMax
  const messages = formatMessagesForMiniMax(currentOutput, userMessage);

  // Hacer la llamada a MiniMax
  const result = await createMiniMaxChat({
    messages,
    apiKey,
    stream,
    onChunk,
  });

  // Crear el request actualizado
  const existingMessages = currentOutput || [];
  const updatedOutput = [...existingMessages, result.assistantMessage];

  const request: AiRequest = {
    id: requestId,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    userId: 'local-minimax',
    status: 'ready',
    mode: 'chat',
    aiConfiguration: {
      presetId: MINIMAX_PRESET_ID,
    },
    error: null,
    output: updatedOutput,
  };

  return {
    request,
    assistantMessage: result.assistantMessage,
  };
};

/**
 * Verifica si un preset ID corresponde a MiniMax
 */
export const isMiniMaxPreset = (presetId: string): boolean => {
  return presetId === MINIMAX_PRESET_ID;
};

/**
 * Crea un AiRequest inicial para MiniMax (para el flujo del frontend)
 */
export const createInitialMiniMaxRequest = (
  userRequest: string,
  requestId: string
): AiRequest => {
  const messageId = generateMessageId();

  // Crear mensaje de usuario
  const userMessage: AiRequestMessage = {
    type: 'message',
    status: 'completed',
    role: 'user',
    content: [
      {
        type: 'user_request',
        status: 'completed',
        text: userRequest,
      },
    ],
    messageId: `user-${messageId}`,
  };

  return {
    id: requestId,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    userId: 'local-minimax',
    status: 'working', // Iniciar en working mientras esperamos respuesta
    mode: 'chat',
    aiConfiguration: {
      presetId: MINIMAX_PRESET_ID,
    },
    error: null,
    output: [userMessage],
  };
};

/**
 * Resetea el cliente de MiniMax (útil para cambiar de API key)
 */
export const resetMiniMaxClient = (): void => {
  miniMaxClient = null;
};

export default {
  createMiniMaxChat,
  addMessageToMiniMaxChat,
  isMiniMaxPreset,
  createInitialMiniMaxRequest,
  formatMessagesForMiniMax,
  resetMiniMaxClient,
  MINIMAX_PRESET_ID,
};
