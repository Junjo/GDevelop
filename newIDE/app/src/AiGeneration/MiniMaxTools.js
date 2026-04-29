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
              'Whether the object should be "global" or "scene" specific.',
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
  {
    type: 'function',
    function: {
      name: 'put_2d_instances',
      description:
        'Places new instance(s), or move/erase existing instances, of an existing object onto a specified 2D layer within a scene using a virtual brush at given X, Y coordinates. Can also be used to resize, rotate, change opacity or Z order of existing 2D instance(s). Existing instances identifiers can be found by calling describe_instances (id field for each instance).',
      parameters: {
        type: 'object',
        properties: {
          scene_name: {
            type: 'string',
            description:
              'The name of the scene where the instances should be placed.',
          },
          object_name: {
            type: 'string',
            description: 'The name of the object to place instances of.',
          },
          layer_name: {
            type: 'string',
            description:
              'The name of the layer where instances should be placed (default: "base").',
          },
          brush_kind: {
            type: 'string',
            description:
              'The type of brush operation: "erase" (delete existing instances), "line" (create line of instances), "grid" (create grid of instances), "random_in_circle" (create random circle of instances), "point" (place at single point), or "none" (no special brush).',
          },
          brush_position: {
            type: 'string',
            description:
              'The X,Y coordinates for the brush position (e.g., "100,200"). If not provided, uses scene center.',
          },
          existing_instance_ids: {
            type: 'string',
            description:
              'Comma-separated list of existing instance IDs to move/erase/modify (optional for new instances).',
          },
          new_instances_count: {
            type: 'number',
            description:
              'Number of new instances to place (default: 1 if no existing instances specified).',
          },
          brush_size: {
            type: 'number',
            description: 'The size of brush for placing instances.',
          },
          brush_end_position: {
            type: 'string',
            description:
              'The X,Y coordinates for brush end position (e.g., "200,300"). Used for line brush operations.',
          },
          instances_z_order: {
            type: 'number',
            description:
              'The Z order for new instances (controls layering/stacking order).',
          },
          instances_size: {
            type: 'string',
            description:
              'The size for new instances (e.g., "50,50" for width,height).',
          },
        },
        required: ['scene_name', 'brush_kind'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'put_3d_instances',
      description:
        'Places new instance(s), or move/erase existing instances, of an existing object onto a specified 3D layer within a scene using a virtual brush at given X, Y, Z coordinates. Can also be used to resize, rotate existing 3D instance(s). Existing instances identifiers can be found by calling describe_instances (id field for each instance).',
      parameters: {
        type: 'object',
        properties: {
          scene_name: {
            type: 'string',
            description:
              'The name of the scene where the instances should be placed.',
          },
          object_name: {
            type: 'string',
            description: 'The name of the object to place instances of.',
          },
          layer_name: {
            type: 'string',
            description:
              'The name of the layer where instances should be placed (default: "base").',
          },
          brush_kind: {
            type: 'string',
            description:
              'The type of brush operation: "erase" (delete existing instances), "line" (create line of instances), "random_in_sphere" (create random sphere of instances), "point" (place at single point), or "none" (no special brush).',
          },
          brush_position: {
            type: 'string',
            description:
              'The X,Y,Z coordinates for brush position (e.g., "100,200,50"). If not provided, uses scene center.',
          },
          existing_instance_ids: {
            type: 'string',
            description:
              'Comma-separated list of existing instance IDs to move/erase/modify (optional for new instances).',
          },
          new_instances_count: {
            type: 'number',
            description:
              'Number of new instances to place (default: 1 if no existing instances specified).',
          },
          brush_size: {
            type: 'number',
            description: 'The size of brush for placing instances.',
          },
          brush_end_position: {
            type: 'string',
            description:
              'The X,Y,Z coordinates for brush end position (e.g., "200,300,100"). Used for line brush operations.',
          },
          instances_size: {
            type: 'string',
            description:
              'The size for new instances (e.g., "50,50" for width,height).',
          },
          instances_rotation: {
            type: 'string',
            description:
              'The rotation for new instances in degrees (e.g., "45" for 45 degrees).',
          },
        },
        required: ['scene_name', 'brush_kind'],
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
    console.info(`[MiniMax Tool] Executing tool: ${toolName}`);
    console.info(`[MiniMax Tool] Parameters:`, JSON.stringify(args, null, 2));

    const editorFunction = editorFunctions[toolName];

    // Ejecutar la función
    const launchParams: any = {
      project,
      args,
      editorCallbacks,
      i18n,
      PixiResourcesLoader,
    };

    // Algunas funciones como put_2d_instances y put_3d_instances necesitan onInstancesModifiedOutsideEditor como parámetro separado
    if (toolName === 'put_2d_instances' || toolName === 'put_3d_instances') {
      console.info(
        `[MiniMax Tool] editorCallbacks keys:`,
        Object.keys(editorCallbacks || {})
      );
      console.info(
        `[MiniMax Tool] onInstancesModifiedOutsideEditor:`,
        typeof editorCallbacks?.onInstancesModifiedOutsideEditor
      );
      if (editorCallbacks?.onInstancesModifiedOutsideEditor) {
        launchParams.onInstancesModifiedOutsideEditor =
          editorCallbacks.onInstancesModifiedOutsideEditor;
      } else {
        console.warn(
          `[MiniMax Tool] onInstancesModifiedOutsideEditor not found in editorCallbacks`
        );
        // Usar una función vacía como fallback para evitar el error
        launchParams.onInstancesModifiedOutsideEditor = () => {};
      }
    }

    const result = await editorFunction.launchFunction(launchParams);

    // Serializar resultado para MiniMax
    const serializedResult = {
      success: result.success,
      ...result,
    };

    console.info(
      `[MiniMax Tool] Result for ${toolName}:`,
      JSON.stringify(serializedResult, null, 2)
    );
    console.info(`[MiniMax Tool] Returning to LLM:`, {
      success: serializedResult.success,
      message: serializedResult.message || 'No message',
      hasData: !!serializedResult.data,
      dataKeys: serializedResult.data ? Object.keys(serializedResult.data) : [],
    });

    return serializedResult;
  } catch (error) {
    console.error(`[MiniMax Tool] Error executing ${toolName}:`, error);
    const errorResult = {
      success: false,
      message: `Error executing ${toolName}: ${error.message ||
        'Unknown error'}`,
    };
    console.info(
      `[MiniMax Tool] Error result for ${toolName}:`,
      JSON.stringify(errorResult, null, 2)
    );
    return errorResult;
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
