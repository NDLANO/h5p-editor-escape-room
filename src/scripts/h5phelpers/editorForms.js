import { getLibraries } from '@context/H5PContext.js';

/**
 * Get scenes field from Three Image semantics structure.
 * @param {object} field Field to start searching at.
 * @returns {object|false} Field from semantics.
 */
export const getSceneField = (field) => {
  return H5PEditor.findSemanticsField(
    'scenes',
    field
  );
};

/**
 * Get playlist field from Three Image semantics structure.
 * @param {object} field Field to start searching at.
 * @returns {object|false} Field from semantics.
 */
export const getPlaylistField = (field) => {
  return H5PEditor.findSemanticsField(
    'playlists',
    field
  );
};

/**
 * Get interactions field within scene from Three Image semantics structure.
 * @param {object} field Field to start searching at.
 * @returns {object|false} Field from semantics.
 */
export const getInteractionsField = (field) => {
  const sceneFields = getSceneField(field);

  return H5PEditor.findSemanticsField(
    'interactions',
    sceneFields
  );
};

/**
 * Get library data for single library.
 * @param {object} field Field with library options.
 * @param {string} libraryName Library full name.
 * @returns {Promise} Promise to return library.
 */
export const getLibraryDataFromFields = async (field, libraryName) => {
  const libraries = await getLibraries(field);
  return libraries.find((lib) => lib.uberName === libraryName);
};

/**
 * Check if children are valid and set error messages for invalid fields.
 * @param {object} children Children to validate.
 * @returns {boolean} True, if all children validate.
 */
export const areChildrenValid = (children) => {
  let isInputsValid = true;

  // validate() should always run for all children because it adds
  // styling to children that fail to validate
  children.forEach((child) => {
    // Special validation for scene image, since having a required image
    // is not supported by core yet
    const isRequiredImage = child.field.type === 'image'
      && (child.field.optional === undefined
        || child.field.optional === false);
    if (isRequiredImage) {
      if (!child.params || !child.params.path) {
        isInputsValid = false;
      }
    }

    // Note that validate() does not necessarily return a bool...
    // e.g. for texts it returns the string
    const isChildValid = child.validate();
    if (isChildValid === false) {
      isInputsValid = false;
    }
  });

  return isInputsValid;
};

/**
 * Add listeners for behavioural settings fields.
 * @param {object} parent Parent field instance.
 * @param {function} callback Callback.
 */
const addBehavioralChangeListeners = (parent, callback) => {
  const behaviour = parent.children.find((child) => {
    return child.field.name === 'behaviour';
  });

  const sceneRendering = behaviour.children.find((child) => {
    return child.field.name === 'sceneRenderingQuality';
  });
  sceneRendering.changes.push(callback);

  const label = behaviour.children.find((child) => {
    return child.field.name === 'label';
  });
  for (let i = 0 ; i < label.children.length ; i++) {
    label.children[i].changes.push(callback);
  }

  const tabOrder = behaviour.children.find((child) => {
    return child.field.name === 'tabOrderMode';
  });
  tabOrder.changes.push(callback);
};

/**
 * Add listeners for behavioural settings fields once ready.
 * @param {object} parent Parent field instance.
 * @param {function} callback Callback.
 */
export const addBehavioralListeners = (parent, callback) => {
  if (parent.children.length === 0) {
    parent.ready(() => {
      addBehavioralChangeListeners(parent, callback);
    });
    return;
  }
  addBehavioralChangeListeners(parent, callback);
};
