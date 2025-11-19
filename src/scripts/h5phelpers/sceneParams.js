import { SceneEditingType } from '@components/EditingDialog/SceneEditor.js';
import { isGoToScene } from './libraryParams.js';

/** @typedef {{ playlistId: string, title: string, audioTracks: object }} Playlist */
/** @typedef {{ playlist: Playlist }} Scene */
/** @typedef {{ yaw: number, pitch: number }} CameraPosition */

/**
 * Get scene from id
 * @param {Scene[]} scenes Scenes.
 * @param {number} sceneId Scene id.
 * @returns {Scene} Scene.
 */
export const getSceneFromId = (scenes, sceneId) => {
  return scenes.find((scene) => scene.sceneId === sceneId);
};

/**
 * Delete scene in parameters and deletes any GoToScene interactions
 * within other scenes that was pointing to the deleted scene
 * @param {Scene[]} scenes Scenes.
 * @param {number} sceneId Scene id.
 * @returns {Scene[]} Scenes.
 */
export const deleteScene = (scenes, sceneId) => {
  // Filter out the scene
  const sceneRemoved = scenes.filter((scene) => scene.sceneId !== sceneId);

  // Filter out any interactions pointing to the scene
  return sceneRemoved.map((scene) => {
    const interactions = scene.interactions;
    if (interactions) {
      scene.interactions = interactions.filter((interaction) => {
        if (!isGoToScene(interaction)) {
          return true;
        }

        // Filter away GoToScene with the deleted scene id
        return interaction.action.params.nextSceneId !== sceneId;
      });
    }

    return scene;
  });
};

/**
 * Updates scene within parameters.
 * @param {Scene[]} scenes Scenes.
 * @param {object} params Parameters to be set.
 * @param {number|null} sceneId Scene id.
 * @returns {Scene[]} Scenes with updated parameters.
 */
export const updateScene = (scenes, params, sceneId = -1) => {
  if (sceneId === SceneEditingType.NEW_SCENE) {
    scenes.push(params);
    return scenes;
  }

  return scenes.map((scene) => {
    if (scene.sceneId === sceneId) {
      // Replace scene
      scene = params;
    }

    return scene;
  });
};

/**
 * Set scene position in parameters.
 * @param {Scene[]} scenes Scenes
 * @param {number} sceneId Scene id.
 * @param {CameraPosition} cameraPosition Camera position.
 */
export const setScenePositionFromCamera = (scenes, sceneId, cameraPosition) => {
  const scene = getSceneFromId(scenes, sceneId);
  scene.cameraStartPosition = `${cameraPosition.yaw},${cameraPosition.pitch}`;
};

