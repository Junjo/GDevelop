// @flow
/**
 * MiniMaxServiceWrapper - Wrapper para integrar MiniMax en el flujo de GDevelop
 *
 * Este módulo proporciona versiones wrapper de las funciones de Generation.js
 * que detectan automáticamente si se debe usar MiniMax o el backend de GDevelop
 */
import {
  createAiRequest as gdevelopCreateAiRequest,
  addMessageToAiRequest as gdevelopAddMessageToAiRequest,
  type AiRequest,
  type AiConfiguration,
} from '../Utils/GDevelopServices/Generation';
import {
  createMiniMaxChat,
  addMessageToMiniMaxChat,
  isMiniMaxPreset,
  createInitialMiniMaxRequest,
  MINIMAX_PRESET_ID,
} from './MiniMaxService';

/**
 * Wrapper para createAiRequest que detecta si usar MiniMax
 */
export const createAiRequest = async (
  getAuthorizationHeader: () => Promise<string>,
  {
    userId,
    userRequest,
    gameProjectJson,
    gameProjectJsonUserRelativeKey,
    projectSpecificExtensionsSummaryJson,
    projectSpecificExtensionsSummaryJsonUserRelativeKey,
    payWithCredits,
    mode,
    aiConfiguration,
    gameId,
    projectVersionIdBeforeMessage,
    fileMetadata,
    storageProviderName,
    toolsVersion,
  }: {|
    userId: string,
    userRequest: string,
    gameProjectJson: string | null,
    gameProjectJsonUserRelativeKey: string | null,
    projectSpecificExtensionsSummaryJson: string | null,
    projectSpecificExtensionsSummaryJsonUserRelativeKey: string | null,
    payWithCredits: boolean,
    mode: 'chat' | 'agent' | 'orchestrator',
    aiConfiguration: AiConfiguration,
    gameId: string | null,
    projectVersionIdBeforeMessage?: string | null,
    fileMetadata?: ?{
      fileIdentifier: string,
      version?: string,
      lastModifiedDate?: number,
      gameId?: string,
    },
    storageProviderName: ?string,
    toolsVersion: string,
  |},
  customApiKey: string
): Promise<AiRequest> => {
  const presetId = aiConfiguration.presetId;

  // Si es MiniMax y tenemos API key, usar MiniMax
  if (isMiniMaxPreset(presetId) && customApiKey && customApiKey.trim() !== '') {
    console.info('Using MiniMax for AI request');

    // Verificar que es modo chat (solo chat soportado en v1)
    if (mode !== 'chat') {
      console.warn(
        'MiniMax only supports chat mode. Falling back to GDevelop backend.'
      );
      return gdevelopCreateAiRequest(getAuthorizationHeader, {
        userId,
        userRequest,
        gameProjectJson,
        gameProjectJsonUserRelativeKey,
        projectSpecificExtensionsSummaryJson,
        projectSpecificExtensionsSummaryJsonUserRelativeKey,
        payWithCredits,
        mode,
        aiConfiguration,
        gameId,
        projectVersionIdBeforeMessage,
        fileMetadata,
        storageProviderName,
        toolsVersion,
      });
    }

    // Crear el request inicial con el mensaje de usuario
    const requestId = `minimax-${Date.now()}-${Math.random()
      .toString(36)
      .substr(2, 9)}`;
    const initialRequest = createInitialMiniMaxRequest(userRequest, requestId);

    try {
      // Hacer la llamada a MiniMax
      const { request } = await createMiniMaxChat({
        messages: [],
        apiKey: customApiKey,
      });

      // El mensaje de usuario ya está en initialRequest.output
      // La respuesta de MiniMax está en request.output
      // Combinar ambos
      const combinedOutput = [
        ...initialRequest.output,
        ...(request.output || []),
      ];

      return {
        ...request,
        id: initialRequest.id,
        output: combinedOutput,
        mode: mode,
      };
    } catch (error) {
      console.error('Error creating MiniMax chat:', error);
      throw error;
    }
  }

  // De lo contrario, usar el backend de GDevelop
  return gdevelopCreateAiRequest(getAuthorizationHeader, {
    userId,
    userRequest,
    gameProjectJson,
    gameProjectJsonUserRelativeKey,
    projectSpecificExtensionsSummaryJson,
    projectSpecificExtensionsSummaryJsonUserRelativeKey,
    payWithCredits,
    mode,
    aiConfiguration,
    gameId,
    projectVersionIdBeforeMessage,
    fileMetadata,
    storageProviderName,
    toolsVersion,
  });
};

/**
 * Wrapper para addMessageToAiRequest que detecta si usar MiniMax
 */
export const addMessageToAiRequest = async (
  getAuthorizationHeader: () => Promise<string>,
  {
    userId,
    aiRequestId,
    functionCallOutputs,
    userMessage,
    gameId,
    projectVersionIdBeforeMessage,
    payWithCredits,
    gameProjectJson,
    gameProjectJsonUserRelativeKey,
    projectSpecificExtensionsSummaryJson,
    projectSpecificExtensionsSummaryJsonUserRelativeKey,
    paused,
    mode,
    toolsVersion,
  }: {|
    userId: string,
    aiRequestId: string,
    userMessage: string,
    gameId?: string,
    projectVersionIdBeforeMessage?: string | null,
    functionCallOutputs: Array<any>,
    payWithCredits: boolean,
    gameProjectJson: string | null,
    gameProjectJsonUserRelativeKey: string | null,
    projectSpecificExtensionsSummaryJson: string | null,
    projectSpecificExtensionsSummaryJsonUserRelativeKey: string | null,
    paused?: boolean,
    mode?: 'chat' | 'agent' | 'orchestrator',
    toolsVersion?: string,
  |},
  customApiKey: string,
  currentAiRequest: ?AiRequest
): Promise<AiRequest> => {
  // Verificar si es una solicitud de MiniMax
  const isMiniMax =
    isMiniMaxPreset(aiRequestId) ||
    (currentAiRequest &&
      isMiniMaxPreset(currentAiRequest.aiConfiguration?.presetId || ''));

  // Si es MiniMax y tenemos API key, usar MiniMax
  if (isMiniMax && customApiKey && customApiKey.trim() !== '') {
    console.info('Using MiniMax for adding message');

    // Verificar que es modo chat
    if (mode !== 'chat') {
      console.warn(
        'MiniMax only supports chat mode. Falling back to GDevelop backend.'
      );
      return gdevelopAddMessageToAiRequest(getAuthorizationHeader, {
        userId,
        aiRequestId,
        functionCallOutputs,
        userMessage,
        gameId,
        projectVersionIdBeforeMessage,
        payWithCredits,
        gameProjectJson,
        gameProjectJsonUserRelativeKey,
        projectSpecificExtensionsSummaryJson,
        projectSpecificExtensionsSummaryJsonUserRelativeKey,
        paused,
        mode,
        toolsVersion,
      });
    }

    // Verificar que no hay function calls pendientes (no soportados en v1)
    if (functionCallOutputs && functionCallOutputs.length > 0) {
      console.warn(
        'MiniMax v1 does not support function calls. Falling back to GDevelop backend.'
      );
      return gdevelopAddMessageToAiRequest(getAuthorizationHeader, {
        userId,
        aiRequestId,
        functionCallOutputs,
        userMessage,
        gameId,
        projectVersionIdBeforeMessage,
        payWithCredits,
        gameProjectJson,
        gameProjectJsonUserRelativeKey,
        projectSpecificExtensionsSummaryJson,
        projectSpecificExtensionsSummaryJsonUserRelativeKey,
        paused,
        mode,
        toolsVersion,
      });
    }

    try {
      // Obtener el output actual del request
      const currentOutput = currentAiRequest?.output || [];

      // Añadir mensaje a MiniMax
      const { request } = await addMessageToMiniMaxChat({
        currentOutput,
        userMessage,
        apiKey: customApiKey,
        requestId: aiRequestId,
      });

      return request;
    } catch (error) {
      console.error('Error adding message to MiniMax chat:', error);
      throw error;
    }
  }

  // De lo contrario, usar el backend de GDevelop
  return gdevelopAddMessageToAiRequest(getAuthorizationHeader, {
    userId,
    aiRequestId,
    functionCallOutputs,
    userMessage,
    gameId,
    projectVersionIdBeforeMessage,
    payWithCredits,
    gameProjectJson,
    gameProjectJsonUserRelativeKey,
    projectSpecificExtensionsSummaryJson,
    projectSpecificExtensionsSummaryJsonUserRelativeKey,
    paused,
    mode,
    toolsVersion,
  });
};

export default {
  createAiRequest,
  addMessageToAiRequest,
  MINIMAX_PRESET_ID,
};
