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
import { miniMaxTools, executeMiniMaxTool } from './MiniMaxTools';

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
  tools?: boolean, // Si debe usar herramientas
  project?: any, // Proyecto de GDevelop para ejecutar herramientas
  editorCallbacks?: any, // Callbacks del editor
  i18n?: any, // Instancia de i18n
};

/**
 * Resultado de una llamada a MiniMax
 */
export type MiniMaxChatResult = {
  content: string,
  reasoning?: string,
  finishReason: 'stop' | 'length' | 'content_filter',
  toolCalls?: Array<any>,
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
  currentUserMessage: string,
  preparedAiUserContent?: any
): Array<MiniMaxMessage> => {
  const messages: Array<MiniMaxMessage> = [];

  // Construir el contenido del mensaje del sistema
  let systemContent = `You are an AI assistant integrated in GDevelop, a game development engine. 
You help users create and modify games using natural language.
When suggesting game logic or events, consider that GDevelop uses a visual event-based system.
Be concise but helpful. If you need to clarify something, ask questions.
You have access to tools that can read information about the project. Use these tools when you need to understand the current state of the project before suggesting changes.`;

  // Añadir información del proyecto si está disponible
  if (preparedAiUserContent) {
    let projectInfo = '';

    // Construir el contenido del proyecto a partir de las propiedades individuales
    if (preparedAiUserContent.gameProjectJson) {
      projectInfo += `\n\nProject Structure:\n${
        preparedAiUserContent.gameProjectJson
      }`;
    }

    if (preparedAiUserContent.projectSpecificExtensionsSummaryJson) {
      projectInfo += `\n\nExtensions:\n${
        preparedAiUserContent.projectSpecificExtensionsSummaryJson
      }`;
    }

    if (preparedAiUserContent.eventsJson) {
      projectInfo += `\n\nEvents:\n${preparedAiUserContent.eventsJson}`;
    }

    if (projectInfo) {
      systemContent += `\n\nHere is the current project information:${projectInfo}`;
    }
  }

  messages.push({
    role: 'system',
    content: systemContent,
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
    } else if (message.type === 'function_call_output') {
      // Respuesta de herramienta - convertir a mensaje de assistant
      if (message.output) {
        let outputText = message.output;
        try {
          const parsed = JSON.parse(message.output);
          if (parsed.message) {
            outputText = parsed.message;
          } else {
            outputText = JSON.stringify(parsed, null, 2);
          }
        } catch (e) {
          // Keep original output text
        }
        messages.push({
          role: 'user', // Tool responses come as user messages in OpenAI format
          content: `Tool result for ${message.name}: ${outputText}`,
        });
      }
    }
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

  // NO añadir tool_calls al contenido del mensaje de assistant
  // Cuando MiniMax ejecuta tools localmente, los function calls causan bucles
  // en el frontend de GDevelop. Solo incluimos los resultados (function_call_output)
  // en el array de output del request, no en el contenido del mensaje de assistant.

  // Añadir texto de respuesta si existe
  if (response.content) {
    content.push({
      type: 'output_text',
      status: 'completed',
      text: response.content,
      annotations: [],
    });
  }

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
 * Procesa los tool calls ejecutando las herramientas localmente
 */
const processToolCalls = async (
  toolCalls: Array<any>,
  project: any,
  editorCallbacks: any,
  i18n: any,
  PixiResourcesLoader: any = null
): Promise<Array<AiRequestMessage>> => {
  const results: Array<AiRequestMessage> = [];

  for (const toolCall of toolCalls) {
    console.info(`Processing tool call: ${toolCall.function.name}`);

    try {
      // Los argumentos llegan directamente como objeto de MiniMax
      const result = await executeMiniMaxTool(
        toolCall.function.name,
        toolCall.function.arguments || {},
        project,
        editorCallbacks,
        i18n,
        PixiResourcesLoader
      );

      const toolResultMessage: AiRequestMessage = {
        type: 'function_call_output',
        status: 'completed',
        call_id: toolCall.id, // Usar el ID original de MiniMax
        name: toolCall.function.name,
        output: JSON.stringify(result),
      };

      results.push(toolResultMessage);
    } catch (error) {
      console.error(`Error executing tool ${toolCall.function.name}:`, error);

      const errorMessage: AiRequestMessage = {
        type: 'function_call_output',
        status: 'completed',
        call_id: toolCall.id, // Usar el ID original de MiniMax
        name: toolCall.function.name,
        output: JSON.stringify({
          success: false,
          message: `Error: ${error.message || 'Unknown error'}`,
        }),
      };

      results.push(errorMessage);
    }
  }

  return results;
};

/**
 * Crea una solicitud de chat con MiniMax
 *
 * Esta función simula el comportamiento del backend de GDevelop:
 * - Crea un ID de request
 * - Hace la llamada a MiniMax
 * - Procesa tool calls si es necesario
 * - Retorna una respuesta formateada
 */
export const createMiniMaxChat = async ({
  messages,
  apiKey,
  stream = false,
  onChunk,
  tools = false,
  project = null,
  editorCallbacks = null,
  i18n = null,
  PixiResourcesLoader = null,
}: CreateMiniMaxChatOptions): Promise<{
  request: AiRequest,
  assistantMessage: AiRequestMessage,
  toolResults?: Array<AiRequestMessage>,
}> => {
  console.info('createMiniMaxChat called with:', {
    messageCount: messages?.length,
    hasApiKey: !!apiKey,
    stream,
    tools,
  });

  const client = getMiniMaxClient(apiKey);
  const requestId = `minimax-${Date.now()}-${Math.random()
    .toString(36)
    .substr(2, 9)}`;
  const messageId = generateMessageId();

  try {
    let fullContent = '';
    let toolCalls = null;

    console.info('Calling MiniMax API with model:', MINIMAX_MODEL);

    // Preparar opciones de la llamada
    const chatOptions: any = {
      model: MINIMAX_MODEL,
      messages: messages,
      stream: stream,
      extra_body: { reasoning_split: true },
    };

    // Añadir tools si está habilitado
    if (tools) {
      chatOptions.tools = miniMaxTools;
      chatOptions.tool_choice = 'auto';
    }

    // Declarar reasoning fuera del bloque para que esté disponible en ambos casos
    let reasoning = null;

    if (stream) {
      chatOptions.stream_options = { include_usage: true };

      const streamResponse = await client.chat.completions.create(chatOptions);

      for await (const chunk of streamResponse) {
        const delta = chunk.choices[0]?.delta;
        if (delta?.content) {
          fullContent += delta.content;
          if (onChunk) {
            onChunk(fullContent);
          }
        }
        // Recoger tool calls del stream si es necesario
        if (delta?.tool_calls) {
          toolCalls = toolCalls || [];
          for (const tc of delta.tool_calls) {
            toolCalls.push(tc);
          }
        }
      }
      // Para streaming, el razonamiento no está disponible aún
    } else {
      const response = await client.chat.completions.create(chatOptions);

      const message = response.choices[0]?.message;
      fullContent = message?.content || '';
      toolCalls = message?.tool_calls || null;

      // Extraer razonamiento si está disponible (con reasoning_split: true)
      reasoning = message?.reasoning || null;

      // Si no hay razonamiento separado, intentar extraerlo de la etiqueta think
      if (!reasoning && fullContent) {
        const thinkMatch = fullContent.match(/<think>(.*?)<\/think>/s);
        if (thinkMatch) {
          reasoning = thinkMatch[1].trim();
          // Remover la etiqueta think del contenido
          fullContent = fullContent
            .replace(/<think[\s\S]*?<\/think>/s, '')
            .trim();
        }
      }
    }

    // Procesar tool calls si los hay
    let toolResults = null;
    if (toolCalls && toolCalls.length > 0) {
      console.info(`Received ${toolCalls.length} tool calls from MiniMax`);
      toolResults = await processToolCalls(
        toolCalls,
        project,
        editorCallbacks,
        i18n,
        PixiResourcesLoader
      );

      // Crear mensaje de assistant sin tool_calls (para evitar bucle en el frontend)
      // Los tool calls se procesan localmente y los resultados se envían de vuelta a MiniMax
      const assistantMessage = formatMiniMaxResponseForGDevelop(
        {
          content: fullContent,
          reasoning,
          finishReason: 'tool_calls',
          toolCalls: null, // No incluir tool calls para evitar bucle
        },
        messageId
      );

      // Enviar los resultados de las tools de vuelta a MiniMax para obtener la respuesta final
      console.info(
        'Sending tool results back to MiniMax for final response...'
      );

      // Construir mensajes para el follow-up call
      const followUpMessages = [
        ...messages,
        {
          role: 'assistant',
          content: fullContent || '',
          tool_calls: toolCalls.map(tc => ({
            id: tc.id,
            type: tc.type,
            function: {
              name: tc.function.name,
              arguments:
                typeof tc.function.arguments === 'string'
                  ? tc.function.arguments
                  : JSON.stringify(tc.function.arguments),
            },
          })),
        },
        ...toolResults.map(result => ({
          role: 'tool',
          tool_call_id: result.call_id,
          content: result.output,
        })),
      ];

      // Llamar a MiniMax de nuevo con los resultados de las tools
      const followUpResponse = await client.chat.completions.create({
        model: 'MiniMax-M2.7',
        messages: followUpMessages,
        tools: tools ? miniMaxTools : undefined,
        extra_body: { reasoning_split: true },
      });

      const followUpMessage = followUpResponse.choices[0]?.message;
      let finalContent = followUpMessage?.content || '';
      const finalToolCalls = followUpMessage?.tool_calls || null;
      let finalReasoning = followUpMessage?.reasoning || null;

      // Si no hay razonamiento separado en la respuesta final, intentar extraerlo de la etiqueta think
      if (!finalReasoning && finalContent) {
        const finalThinkMatch = finalContent.match(/<think>(.*?)<\/think>/s);
        if (finalThinkMatch) {
          finalReasoning = finalThinkMatch[1].trim();
          // Remover la etiqueta think del contenido final
          finalContent = finalContent
            .replace(/<think[\s\S]*?<\/think>/s, '')
            .trim();
        }
      }

      // Si hay más tool calls, procesarlas recursivamente
      if (finalToolCalls && finalToolCalls.length > 0) {
        console.info(
          `Received ${finalToolCalls.length} more tool calls from MiniMax`
        );
        const additionalToolResults = await processToolCalls(
          finalToolCalls,
          project,
          editorCallbacks,
          i18n,
          PixiResourcesLoader
        );

        // Crear mensaje final con la respuesta
        const finalAssistantMessage = formatMiniMaxResponseForGDevelop(
          {
            content: finalContent,
            reasoning: finalReasoning,
            finishReason: 'stop',
            toolCalls: finalToolCalls,
          },
          `minimax-${Date.now()}-final`
        );

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
          output: [
            assistantMessage,
            ...toolResults,
            finalAssistantMessage,
            ...additionalToolResults,
          ],
        };

        return {
          request,
          assistantMessage: finalAssistantMessage,
          toolResults: [...toolResults, ...additionalToolResults],
        };
      }

      // Crear mensaje final con la respuesta de MiniMax
      const finalAssistantMessage = formatMiniMaxResponseForGDevelop(
        {
          content: finalContent,
          reasoning: finalReasoning,
          finishReason: 'stop',
        },
        `minimax-${Date.now()}-final`
      );

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
        output: [assistantMessage, ...toolResults, finalAssistantMessage],
      };

      return {
        request,
        assistantMessage: finalAssistantMessage,
        toolResults,
      };
    }

    // Sin tool calls - respuesta normal
    const assistantMessage = formatMiniMaxResponseForGDevelop(
      {
        content: fullContent,
        reasoning,
        finishReason: 'stop',
      },
      messageId
    );

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
  tools = false,
  project = null,
  editorCallbacks = null,
  i18n = null,
  PixiResourcesLoader = null,
  preparedAiUserContent = null,
}: {
  currentOutput?: ?Array<AiRequestMessage>,
  userMessage: string,
  apiKey: string,
  requestId: string,
  stream?: boolean,
  onChunk?: (content: string) => void,
  tools?: boolean,
  project?: any,
  editorCallbacks?: any,
  i18n?: any,
  PixiResourcesLoader?: any,
  preparedAiUserContent?: any,
}): Promise<{
  request: AiRequest,
  assistantMessage: AiRequestMessage,
  toolResults?: Array<AiRequestMessage>,
}> => {
  // Convertir mensajes existentes + nuevo mensaje al formato de MiniMax
  const messages = formatMessagesForMiniMax(
    currentOutput,
    userMessage,
    preparedAiUserContent
  );

  // Hacer la llamada a MiniMax
  const result = await createMiniMaxChat({
    messages,
    apiKey,
    stream,
    onChunk,
    tools,
    project,
    editorCallbacks,
    i18n,
    PixiResourcesLoader,
  });

  // Crear el request actualizado
  const existingMessages = currentOutput || [];
  const updatedOutput = [...existingMessages, result.assistantMessage];

  // Añadir resultados de tools si los hay
  if (result.toolResults) {
    updatedOutput.push(...result.toolResults);
  }

  const request: AiRequest = {
    id: requestId,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    userId: 'local-minimax',
    status: 'ready', // Tools ya ejecutadas localmente, trabajo completado
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
    toolResults: result.toolResults,
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
    status: 'working',
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

/**
 * Obtiene las herramientas disponibles para MiniMax
 */
export const getMiniMaxAvailableTools = () => {
  return miniMaxTools;
};

export default {
  createMiniMaxChat,
  addMessageToMiniMaxChat,
  isMiniMaxPreset,
  createInitialMiniMaxRequest,
  formatMessagesForMiniMax,
  resetMiniMaxClient,
  getMiniMaxAvailableTools,
  MINIMAX_PRESET_ID,
  miniMaxTools,
};
