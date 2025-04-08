import { getSceneField, areChildrenValid } from '@h5phelpers/editorForms.js';
import { SceneTypes } from '@components/Scene/Scene.js';

/** @typedef {{ playlistId: string, title: string, audioTracks: object }} Playlist */
/** @typedef {{ playlist: Playlist }} Scene */

const DefaultInteractionValues = {
  threeSixty: {
    spread: 20,
  },
  static: {
    spread: 30,
    center: [50, 50],
  }
};

/** @constant {number} DEFAULT_HOTSPOT_MIN_WIDTH Minimum width for hotspot. */
const DEFAULT_HOTSPOT_MIN_WIDTH = 20;

/** @constant {number} DEFAULT_HOTSPOT_MIN_HEIGHT Minimum height for hotspot. */
const DEFAULT_HOTSPOT_MIN_HEIGHT = 20;

/** @constant {number} DEFAULT_HOTSPOT_MAX_WIDTH Maximum width for hotspot. */
const DEFAULT_HOTSPOT_MAX_WIDTH = 2000;

/** @constant {number} DEFAULT_HOTSPOT_MAX_HEIGHT Maximum height for hotspot. */
const DEFAULT_HOTSPOT_MAX_HEIGHT = 2000;

/**
 * Creates scene form and appends it to wrapper
 * @param {object} field Field to display in form.
 * @param {object} params Parameters from form.
 * @param {HTMLElement} wrapper Element to attach to.
 * @param {object} parent Parent field.
 */
export const createSceneForm = (field, params, wrapper, parent) => {
  const sceneField = getSceneField(field);
  const hiddenSceneFields = [
    'sceneId',
    'cameraStartPosition',
    'interactions',
  ];

  const sceneFields = sceneField.field.fields.filter((sceneField) => {
    return !hiddenSceneFields.includes(sceneField.name);
  });

  H5PEditor.processSemanticsChunk(
    sceneFields,
    params,
    wrapper,
    parent,
  );
};

/**
 * Get random position within percentage spread around the center position.
 * @param {number} center Center position.
 * @param {number} spread Spread parameters.
 * @returns {number} Random position around center.
 */
const spreadByValue = (center, spread) => {
  return center - (spread / 2) + (Math.random() * spread);
};

/**
 * Check if scene form is valid and mark invalid fields.
 * @param {object} children Childrento check.
 * @returns {boolean} True if valid, else false.
 */
export const validateSceneForm = (children) => {
  H5PEditor.Html.removeWysiwyg();
  return areChildrenValid(children);
};

/**
 * Check if single interaction has valid position given scene type.
 * @param {object} interaction Interaction.
 * @param {string} sceneType 360, panorama, static.
 * @returns {boolean} True, if position is valid.
 */
const isInteractionPositionValid = (interaction, sceneType) => {
  const position = interaction.interactionpos.split(',');

  if (sceneType === SceneTypes.THREE_SIXTY_SCENE) {
    return position.every((pos) => pos.substr(-1) !== '%');
  }
  else if (sceneType === SceneTypes.STATIC_SCENE) {
    return position.every((pos) => pos.substr(-1) === '%');
  }
  else if (sceneType === SceneTypes.PANORAMA_SCENE) {
    const allAbsolutes = position.every((pos) => pos.substr(-1) !== '%');
    if (!allAbsolutes) {
      return false;
    }
    const no = parseFloat(position[1]);
    return (no > -0.5 && no < 0.5); // Should mean that position is visible in panorama
  }
  else {
    return false;
  }
};

/**
 * Get default interaction position given scene type.
 * @param {string} sceneType 360, panorama, static.
 * @param {string} cameraPos Camera position.
 * @returns {string} Position for CSS.
 */
const getNewInteractionPos = (sceneType, cameraPos) => {
  const isThreeSixtyScene =
    sceneType === SceneTypes.THREE_SIXTY_SCENE ||
    sceneType === SceneTypes.PANORAMA_SCENE;

  // Place interactions spread randomly within a threshold in degrees
  const center = (isThreeSixtyScene) ?
    cameraPos.split(',').map(parseFloat) :
    DefaultInteractionValues.static.center;

  const spread = (isThreeSixtyScene) ?
    DefaultInteractionValues.threeSixty.spread * Math.PI / 180 :
    DefaultInteractionValues.static.spread;

  return center
    .map((pos) => {
      const newPos = spreadByValue(pos, spread);
      return isThreeSixtyScene ? newPos : `${newPos}%`;
    })
    .join(',');
};

/**
 * Set default position for interaction if it has invalid position for given
 * scene type.
 * @param {object} params Interaction.
 * @param {object} params.interaction Interaction.
 * @param {string} params.sceneType 360, panorama, static.
 * @param {string} params.cameraPos Camera position.
 * @param {string} [params.previewSize] Current width and height of preview size.
 * @param {string} [params.previousSceneType] 360, panorama, static.
 */
export const sanitizeInteractionGeometry = ({
  interaction, sceneType, cameraPos, previewSize = {}, previousSceneType
}) => {
  if (!isInteractionPositionValid(interaction, sceneType)) {
    interaction.interactionpos = getNewInteractionPos(sceneType, cameraPos);
  }

  // Default to 1:1
  previewSize.width = previewSize.width ?? 100;
  previewSize.height = previewSize.height ?? 100;

  // TODO: There should be a distinction between 360 and static!
  let minWidth = DEFAULT_HOTSPOT_MIN_WIDTH;
  let minHeight = DEFAULT_HOTSPOT_MIN_HEIGHT;
  let maxWidth = DEFAULT_HOTSPOT_MAX_WIDTH;
  let maxHeight = DEFAULT_HOTSPOT_MAX_HEIGHT;

  let targetWidth, targetHeight;
  let [width, height] = (interaction.hotspotSettings.hotSpotSizeValues || '')
    .split(',');

  /*
   * This is merely a hotfix.
   * TODO: Set all default values in a central place and fetch from there across editor/view.
   */
  if (sceneType === 'static' && width === '256' && height === '128') {
    /*
     * Default values are pixel values meant for 360 scenes set in the view's sanitization
     * function. These are not appropriate for static scenes which use percentage values.
     */
    interaction.hotspotSettings.hotSpotSizeValues = `${25},${25}`;
  }

  if (typeof previousSceneType !== 'string' || previousSceneType === sceneType) {
    return; // Scene type did not change
  }

  if (
    previousSceneType === 'static' &&
    (sceneType === '360' || sceneType === 'panorama')
  ) {
    // Convert static into 360 (current percentage to pixels)
    targetWidth = width / 100 * previewSize.width;
    targetHeight = height / 100 * previewSize.height;
  }
  else if (
    (previousSceneType === '360' || previousSceneType === 'panorama') &&
    sceneType === 'static'
  ) {
    const [x, y] = interaction.interactionpos.split(',');

    // Percentage value of mininum size for current preview size
    minWidth = minWidth / previewSize.width * 100;
    minHeight = minHeight / previewSize.height * 100;

    // Max size as 100% - position percentage
    maxWidth = 100 - parseFloat(x);
    maxHeight = 100 - parseFloat(y);

    // Convert 360 into static (pixels into current percentage)
    targetWidth = width / previewSize.width * 100;
    targetHeight = height / previewSize.height * 100;
  }
  else if (previousSceneType === '360' && sceneType === 'panorama') {
    // TODO: Improvement: Resize suitable for Panorama. May require to change hotspot size max size
  }

  targetWidth = Math.max(minWidth, Math.min(targetWidth, maxWidth));
  targetHeight = Math.max(minHeight, Math.min(targetHeight, maxHeight));

  if (!targetWidth || !targetHeight) {
    return;
  }

  interaction.hotspotSettings.hotSpotSizeValues = `${targetWidth},${targetHeight}`;
};

/**
 * Set default values for scene parameters that are not initially set by user
 * when creating scene.
 * @param {object} params Parameters.
 * @param {string} sceneType 360, panorama, static.
 * @param {string} cameraPos Camera position.
 * @param {object} [previewSize] Current scene preview wrapper bounding client rect.
 * @param {string} previousSceneType 360, panorama, static.
 */
export const sanitizeSceneForm = (
  params, sceneType, cameraPos, previewSize = {}, previousSceneType
) => {
  if (!params.cameraStartPosition) {
    params.cameraStartPosition = `${-(Math.PI * (2 / 3))},0`;
  }

  (params.interactions ?? []).forEach((interaction) => {
    sanitizeInteractionGeometry({
      interaction, sceneType, cameraPos, previewSize, previousSceneType
    });
  });
};

/**
 * Check if all interactions have valid positions.
 * @param {object} params Parameters.
 * @param {string} sceneType 360, panorama, static.
 * @returns {boolean} True if all interactions have valid positions.
 */
export const isInteractionsValid = (params, sceneType) => {
  if (!params.interactions) {
    return true;
  }

  return params.interactions.every((interaction) => {
    return isInteractionPositionValid(interaction, sceneType);
  });
};

/**
 * Grab unique ID that is higher than the highest ID in our scenes collection.
 * @param {Scene[]} scenes Scenes.
 * @returns {number} New id.
 */
const getUniqueSceneId = (scenes) => {
  if (!scenes.length) {
    return 0;
  }

  const sceneIds = scenes.map((scene) => scene.sceneId);
  const maxSceneId = Math.max(...sceneIds);
  return maxSceneId + 1;
};

/**
 * Get initial parameters for empty scene.
 * @param {Scene[]} scenes Scenes.
 * @returns {object} Initial parameters.
 */
export const getDefaultSceneParams = (scenes) => {
  return {
    sceneId: getUniqueSceneId(scenes),
  };
};
