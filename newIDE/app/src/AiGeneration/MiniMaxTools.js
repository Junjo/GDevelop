// @flow
/**
 * MiniMaxTools - Definiciones de herramientas para MiniMax
 *
 * Estas herramientas permiten que MiniMax consulte información del proyecto
 * abierto en GDevelop. Son herramientas de solo lectura para consultar datos.
 */

// Schema de herramientas en formato OpenAI compatible
export const miniMaxTools = [
  {
    type: 'function',
    function: {
      name: 'read_scene_events',
      description:
        'Read the events from a specific scene in the project. Returns the events as text, which is useful for understanding the current logic of a scene.',
      parameters: {
        type: 'object',
        properties: {
          scene_name: {
            type: 'string',
            description: 'The name of the scene to read events from.',
          },
        },
        required: ['scene_name'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'inspect_object_properties',
      description:
        'Get detailed information about an object in the project, including its type, properties, behaviors, and animations. This is useful to understand what an object can do and how to modify it.',
      parameters: {
        type: 'object',
        properties: {
          scene_name: {
            type: 'string',
            description:
              "The name of the scene where the object is located (or 'global' if the object is a global object).",
          },
          object_name: {
            type: 'string',
            description: 'The name of the object to inspect.',
          },
        },
        required: ['scene_name', 'object_name'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'describe_instances',
      description:
        'Get information about object instances placed in a scene, including their positions and layers. This is useful to understand the current layout and placement of objects.',
      parameters: {
        type: 'object',
        properties: {
          scene_name: {
            type: 'string',
            description:
              'The name of the scene to get instance information from.',
          },
          filter_by_object_name: {
            type: 'string',
            description:
              'Optional filter to only return instances of a specific object name.',
          },
        },
        required: ['scene_name'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'inspect_scene_properties_layers_effects',
      description:
        'Get comprehensive information about a scene including its properties (size, background color), all layers, and effects applied to layers. This is useful to understand the visual setup of a scene.',
      parameters: {
        type: 'object',
        properties: {
          scene_name: {
            type: 'string',
            description: 'The name of the scene to inspect.',
          },
        },
        required: ['scene_name'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'read_full_docs',
      description:
        'Read the full documentation for one or more extensions. Returns detailed information about what features and behaviors are available from the extension.',
      parameters: {
        type: 'object',
        properties: {
          extension_names: {
            type: 'string',
            description:
              "Comma-separated list of extension names to read documentation for (e.g., 'Sprite, Keyboard, PlatformBehavior').",
          },
        },
        required: ['extension_names'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'inspect_behavior_properties',
      description:
        'Get detailed information about a specific behavior attached to an object, including its properties and current configuration.',
      parameters: {
        type: 'object',
        properties: {
          scene_name: {
            type: 'string',
            description: 'The name of the scene where the object is located.',
          },
          object_name: {
            type: 'string',
            description: 'The name of the object that has the behavior.',
          },
          behavior_name: {
            type: 'string',
            description:
              "The name of the behavior to inspect (e.g., 'PlatformerObject' for PlatformBehavior).",
          },
        },
        required: ['scene_name', 'object_name', 'behavior_name'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'create_object',
      description:
        'Create a new object in a scene or globally, or replace an existing object, or duplicate an existing object. This is useful for adding new game elements to your project.',
      parameters: {
        type: 'object',
        properties: {
          scene_name: {
            type: 'string',
            description:
              'The name of the scene where the object should be created (or "global" for global objects).',
          },
          object_name: {
            type: 'string',
            description: 'The name of the object to create.',
          },
          object_type: {
            type: 'string',
            description:
              'The type of object to create (e.g., "Sprite", "Text", "TiledSprite", "TileMap", etc.).',
          },
          target_object_scope: {
            type: 'string',
            description:
              'Whether the object should be "global" or specific to the scene.',
          },
          replace_existing_object: {
            type: 'boolean',
            description:
              'Whether to replace an existing object with the same name.',
          },
          duplicated_object_name: {
            type: 'string',
            description:
              'If specified, the name of an existing object to duplicate.',
          },
        },
        required: ['scene_name', 'object_name'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'change_object_property',
      description:
        'Change one or more properties of a specific object (global or in a scene). This is useful for modifying object characteristics like size, position, color, etc.',
      parameters: {
        type: 'object',
        properties: {
          scene_name: {
            type: 'string',
            description:
              'The name of the scene where the object is located (or "global" for global objects).',
          },
          object_name: {
            type: 'string',
            description: 'The name of the object to modify.',
          },
          changed_properties: {
            type: 'array',
            description:
              'Array of property changes with "property_name" and "new_value" fields.',
            items: {
              type: 'object',
              properties: {
                property_name: {
                  type: 'string',
                  description: 'The name of the property to change.',
                },
                new_value: {
                  type: 'string',
                  description: 'The new value for the property.',
                },
              },
              required: ['property_name', 'new_value'],
            },
          },
        },
        required: ['scene_name', 'object_name', 'changed_properties'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'add_behavior',
      description:
        'Add a behavior to an object in a scene. This is useful for giving objects new capabilities like movement, physics, platforming, etc.',
      parameters: {
        type: 'object',
        properties: {
          scene_name: {
            type: 'string',
            description: 'The name of the scene where the object is located.',
          },
          object_name: {
            type: 'string',
            description: 'The name of the object to add the behavior to.',
          },
          behavior_type: {
            type: 'string',
            description:
              'The type of behavior to add (e.g., "PlatformBehavior", "PathBehavior", "TopDownMovementBehavior", etc.).',
          },
          behavior_name: {
            type: 'string',
            description: 'Optional custom name for the behavior.',
          },
        },
        required: ['scene_name', 'object_name', 'behavior_type'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'remove_behavior',
      description:
        'Remove a behavior from an object in a scene. This is useful for removing capabilities that are no longer needed.',
      parameters: {
        type: 'object',
        properties: {
          scene_name: {
            type: 'string',
            description: 'The name of the scene where the object is located.',
          },
          object_name: {
            type: 'string',
            description: 'The name of the object to remove the behavior from.',
          },
          behavior_name: {
            type: 'string',
            description: 'The name of the behavior to remove.',
          },
        },
        required: ['scene_name', 'object_name', 'behavior_name'],
      },
    },
  },
];

/**
 * Ejecuta una herramienta localmente usando EditorFunctions
 *
 * @param toolName - Nombre de la herramienta a ejecutar
 * @param arguments - Argumentos de la herramienta (JSON string)
 * @param project - El proyecto de GDevelop
 * @param editorCallbacks - Callbacks del editor
 * @param i18n - Instancia de i18n
 * @returns Promise con el resultado de la ejecución
 */
export const executeMiniMaxTool = async (
  toolName: string,
  toolCallArguments: any,
  project: ?gdProject,
  editorCallbacks: any,
  i18n: any,
  PixiResourcesLoader: any = null
): Promise<any> => {
  const gd: libGDevelop = global.gd;

  // Los argumentos pueden llegar como string JSON (del SDK de OpenAI) o como objeto
  let args = toolCallArguments;
  if (typeof args === 'string') {
    try {
      args = JSON.parse(args);
    } catch (e) {
      return {
        success: false,
        message: `Invalid arguments: could not parse JSON string`,
      };
    }
  }

  // Verificar que tenemos args válidos
  if (!args || typeof args !== 'object') {
    return {
      success: false,
      message: `Invalid arguments: expected an object`,
    };
  }

  // Imports dinámicos para evitar dependencias circulares
  const { editorFunctions } = require('../EditorFunctions');

  // Verificar que la función existe
  if (!editorFunctions[toolName]) {
    return {
      success: false,
      message: `Unknown tool: ${toolName}`,
    };
  }

  // Verificar que tenemos proyecto para herramientas que lo requieren
  const toolRequiresProject =
    toolName !== 'initialize_project' && toolName !== 'read_full_docs';
  if (!project && toolRequiresProject) {
    return {
      success: false,
      message: `Tool ${toolName} requires a project to be initialized. Use initialize_project first.`,
    };
  }

  try {
    const editorFunction = editorFunctions[toolName];

    // Ejecutar la función
    const result = await editorFunction.launchFunction({
      project,
      args,
      editorCallbacks,
      i18n,
      PixiResourcesLoader,
    });

    // Serializar resultado para MiniMax
    return {
      success: result.success,
      ...result,
    };
  } catch (error) {
    console.error(`Error executing tool ${toolName}:`, error);
    return {
      success: false,
      message: `Error executing ${toolName}: ${error.message ||
        'Unknown error'}`,
    };
  }
};

/**
 * Convierte los tool calls de MiniMax al formato de GDevelop
 */
export const formatToolCallsForMiniMaxResponse = (
  toolCalls: Array<any>
): Array<any> => {
  return toolCalls.map((toolCall, index) => ({
    type: 'function_call',
    status: 'completed',
    name: toolCall.function.name,
    call_id: `minimax-tool-${Date.now()}-${index}`,
    arguments: JSON.stringify(toolCall.function.arguments || {}),
  }));
};

export default {
  miniMaxTools,
  executeMiniMaxTool,
  formatToolCallsForMiniMaxResponse,
};
