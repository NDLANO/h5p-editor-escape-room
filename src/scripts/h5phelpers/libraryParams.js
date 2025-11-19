import { getSceneFromId } from './sceneParams.js';

/** @typedef {{ playlistId: string, title: string, audioTracks: object }} Playlist */
/** @typedef {{ playlist: Playlist }} Scene */

export const Libraries = {
  GoToScene: {
    machineName: 'H5P.GoToScene',
  },
};

/**
 * Get default params for a library
 * @param {string} uberName Library Uber name.
 * @returns {object} Library parameters.
 */
export const getDefaultLibraryParams = (uberName) => {
  return {
    id: H5P.createUUID(),
    interactionpos: '', // Filled in on saving interaction
    action: {
      library: uberName,
      params: {}
    }
  };
};

/**
 * @param {HTMLElement} element Element.
 * @param {Scene[]} scenes Scenes.
 * @param {number} sceneId Scene id.
 * @returns {object} Interaction.
 */
export const getInteractionFromElement = (element, scenes, sceneId) => {
  const interactionId = element.dataset.interactionId;

  const scene = getSceneFromId(scenes, sceneId);
  return scene.interactions.find((interaction) => interaction.id === interactionId);
};

/**
 * Updates position of interaction
 * @param {object} interaction Interaction.
 * @param {object} pos Camera position.
 */
export const updatePosition = (interaction, pos) => {
  interaction.interactionpos = `${pos.yaw},${pos.pitch}`;
};

/**
 * Checks if an interaction is a GoToScene library
 * @param {object} interaction Interaction.
 * @returns {boolean} True, if interaction is GoToScene, else false.
 */
export const isGoToScene = (interaction) => {
  const library = H5P.libraryFromString(interaction.action.library);
  return library.machineName === Libraries.GoToScene.machineName;
};
