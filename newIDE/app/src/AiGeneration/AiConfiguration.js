// @flow
import { type Limits } from '../Utils/GDevelopServices/Usage';
import {
  type AiConfigurationPreset,
  type AiSettings,
} from '../Utils/GDevelopServices/Generation';

export type AiConfigurationPresetWithAvailability = {|
  ...AiConfigurationPreset,
  disabled: boolean,
  enableWith: 'higher-tier-plan' | null,
|};

export const getAiConfigurationPresetsWithAvailability = ({
  getAiSettings,
  limits,
  customAiProviderApiKey,
}: {|
  getAiSettings: () => AiSettings | null,
  limits: ?Limits,
  customAiProviderApiKey: string,
|}): Array<AiConfigurationPresetWithAvailability> => {
  const aiSettings = getAiSettings();
  if (!aiSettings) {
    return [];
  }

  let presets = [];

  if (!limits) {
    presets = aiSettings.aiRequest.presets.map(preset => ({
      ...preset,
      enableWith: null,
      disabled: preset.isDefault ? false : true,
    }));
  } else {
    presets = aiSettings.aiRequest.presets.map(preset => {
      const presetAvailability = limits.capabilities.ai.availablePresets.find(
        presetAvailability =>
          presetAvailability.id === preset.id &&
          presetAvailability.mode === preset.mode
      );

      return {
        ...preset,
        disabled:
          presetAvailability && presetAvailability.disabled !== undefined
            ? presetAvailability.disabled
            : preset.disabled,
        enableWith:
          (presetAvailability && presetAvailability.enableWith) || null,
      };
    });
  }

  // Add custom MiniMax preset only if API key is configured
  if (customAiProviderApiKey && customAiProviderApiKey.trim() !== '') {
    presets.push({
      mode: 'chat',
      id: 'minimax-m27-custom',
      nameByLocale: {
        en: 'CUSTOM: MiniMax 2.7',
        es: 'CUSTOM: MiniMax 2.7',
        fr: 'CUSTOM: MiniMax 2.7',
        de: 'CUSTOM: MiniMax 2.7',
        zh: 'CUSTOM: MiniMax 2.7',
        ja: 'CUSTOM: MiniMax 2.7',
      },
      disabled: false,
      enableWith: null,
      isDefault: false,
    });
  }

  return presets;
};

export const getDefaultAiConfigurationPresetId = (
  mode: 'chat' | 'agent' | 'orchestrator',
  aiConfigurationPresetsWithAvailability: Array<AiConfigurationPresetWithAvailability>
): string => {
  // First, check if MiniMax custom preset is available for chat mode
  if (mode === 'chat') {
    const miniMaxPreset = aiConfigurationPresetsWithAvailability.find(
      preset => preset.id === 'minimax-m27-custom' && !preset.disabled
    );
    if (miniMaxPreset) {
      return 'minimax-m27-custom';
    }
  }

  // Fall back to original logic
  const defaultPresetWithAvailability = aiConfigurationPresetsWithAvailability.find(
    preset => preset.isDefault && preset.mode === mode
  );

  return (
    (defaultPresetWithAvailability && defaultPresetWithAvailability.id) ||
    'default'
  );
};
