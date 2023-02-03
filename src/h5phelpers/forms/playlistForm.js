import { getPlaylistField, isChildrenValid } from '../editorForms';

/**
 * Creates playlist form and appends it to wrapper
 *
 * @param {Object} field
 * @param {Object} params
 * @param {HTMLElement} wrapper
 * @param {Object} parent
 */
export const createPlaylistForm = (field, params, wrapper, parent) => {
  const playlistField = getPlaylistField(field);

  const playlistFields = playlistField.field.fields;

  H5PEditor.processSemanticsChunk(
    playlistFields,
    params,
    wrapper,
    parent,
  );
};

/**
 * Checks if playlist form is valid and marks invalid fields
 *
 * @param children
 * @returns {boolean} True if valid
 */
export const validatePlaylistForm = (children) => {
  H5PEditor.Html.removeWysiwyg();
  return isChildrenValid(children);
};

/**
 * Grabs a unique ID that is higher than the highest ID in our playlists collection.
 *
 * @param {Playlist[]} playlists
 * @returns {number}
 */
const getUniquePlaylistId = () => H5P.createUUID();

/**
 * Get initial parameters for an empty playlist
 *
 * @returns {Playlist}
 */
export const getDefaultPlaylistParams = () => ({
  playlistId: getUniquePlaylistId(),
});
