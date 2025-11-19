import React from 'react';
import PropTypes from 'prop-types';
import Scene, { SceneTypes } from '@components/Scene/Scene.js';
import ControlBar from './ControlBar/ControlBar.js';
import SceneEditor, { SceneEditingType } from '@components/EditingDialog/SceneEditor.js';
import InteractionsBar from '@components/InteractionsBar/InteractionsBar.js';
import InteractionEditor, { InteractionEditingType } from '@components/EditingDialog/InteractionEditor.js';
import { H5PContext } from '@context/H5PContext.js';
import { deleteScene, getSceneFromId, setScenePositionFromCamera, updateScene } from '@h5phelpers/sceneParams.js';
import { getInteractionFromElement, isGoToScene, updatePosition } from '@h5phelpers/libraryParams.js';
import { showConfirmationDialog } from '@h5phelpers/h5pComponents.js';
import { addBehavioralListeners } from '@h5phelpers/editorForms.js';
import '@components/Main.scss';

export default class Main extends React.Component {
  /**
   * @param {object} props Props (React).
   * @param {number} props.initialScene Id of initial scene.
   */
  constructor(props) {
    super(props);
    this.props = props;

    this.scenePreview = null;

    this.state = {
      editingScene: SceneEditingType.NOT_EDITING,
      editingLibrary: null,
      editingInteraction: InteractionEditingType.NOT_EDITING,
      currentScene: this.props.initialScene,
      startScene: this.props.initialScene,
      isSceneUpdated: false,
      isSceneSelectorExpanded: false,
      currentCameraPosition: null
    };
  }

  /**
   * Handle component did mount (React).
   */
  componentDidMount() {
    addBehavioralListeners(this.context.parent, () => {
      this.setState({ isSceneUpdated: false });
    });
  }

  /**
   * Edit scene.
   * @param {number|null} sceneId Scene if of scene to be edited.
   */
  editScene(sceneId = SceneEditingType.NEW_SCENE) {
    this.toggleExpandSceneSelector(false);
    this.setState({ editingScene: sceneId });
  }

  /**
   * Update current scene.
   * @param {number} deletedSceneId Id of scene that might be deleted.
   */
  updateCurrentScene(deletedSceneId) {
    const hasDeletedCurrentScene = deletedSceneId === this.state.currentScene;
    if (!hasDeletedCurrentScene) {
      return;
    }

    const scenes = this.context.params.scenes;
    if (scenes.length) {
      // Find the first scene that is not current scene and jump to it
      const newScene = scenes[0];
      this.changeScene(newScene.sceneId);
      return;
    }

    // No scenes left
    this.changeScene(SceneTypes.NO_SCENE);
  }

  /**
   * Update start scene.
   * @param {number} deletedSceneId Id of scene that might be deleted.
   */
  updateStartScene(deletedSceneId) {
    const hasDeletedStartScene = deletedSceneId === this.state.startScene;
    if (!hasDeletedStartScene) {
      return;
    }

    let startScene = null;
    const scenes = this.context.params.scenes;
    if (scenes.length) {
      const newScene = scenes[0];
      startScene = newScene.sceneId;
    }

    // No scenes left
    this.setStartScene(startScene);
  }

  /**
   * Open dialog for cloning a scene.
   * @param {number} sceneId Id of scene to be cloned.
   */
  cloneScene(sceneId) {
    const isNewScene = sceneId === SceneEditingType.NEW_SCENE;
    const deleteSceneText = isNewScene
      ? this.context.t('cloneSceneText')
      : this.context.t('cloneSceneTextWithObjects');

    // Confirm deletion
    showConfirmationDialog({
      headerText: this.context.t('cloneSceneTitle'),
      dialogText: deleteSceneText,
      cancelText: this.context.t('cancel'),
      confirmText: this.context.t('confirm'),
    }, this.confirmedCloneScene.bind(this, sceneId));
  }

  /**
   * Clone a scene.
   * @param {number} sceneId Id of scene to be cloned.
   */
  confirmedCloneScene(sceneId) {
    const scenes = this.context.params.scenes;
    const scene = getSceneFromId(scenes, sceneId);
    const newScene = JSON.parse(JSON.stringify(scene));

    newScene.sceneId = 0;
    newScene.scenename = `${newScene.scenename} (${this.context.t('copy')})`;

    for (let i = 0; i < scenes.length; i++) {
      if (parseInt(scenes[i].sceneId) >= Math.floor(newScene.sceneId)) {
        newScene.sceneId = scenes[i].sceneId + 1;
      }
    }

    scenes.push(newScene);

    this.updateCurrentScene(scene.sceneId);
    this.updateStartScene(scene.sceneId);
    this.setState({ isSceneUpdated: false });
  }

  /**
   * Open dialog for deleting a scene.
   * @param {number} sceneId Id of scene to be deleted.
   */
  deleteScene(sceneId) {
    const isNewScene = sceneId === SceneEditingType.NEW_SCENE;
    const deleteSceneText = isNewScene
      ? this.context.t('deleteSceneText')
      : this.context.t('deleteSceneTextWithObjects');

    // Confirm deletion
    showConfirmationDialog({
      headerText: this.context.t('deleteSceneTitle'),
      dialogText: deleteSceneText,
      cancelText: this.context.t('cancel'),
      confirmText: this.context.t('confirm'),
    }, this.confirmedDeleteScene.bind(this, sceneId));
  }

  /**
   * Delete scene.
   * @param {number} sceneId Id of scene to be deleted.
   */
  confirmedDeleteScene(sceneId) {
    this.setState({
      editingScene: SceneEditingType.NOT_EDITING,
      isSceneSelectorExpanded: false,
    });

    // Scene not added to params
    if (sceneId === SceneEditingType.NEW_SCENE) {
      return;
    }

    const scenes = this.context.params.scenes;
    const scene = getSceneFromId(scenes, sceneId);
    this.context.params.scenes = deleteScene(scenes, sceneId);

    this.updateCurrentScene(scene.sceneId);
    this.updateStartScene(scene.sceneId);
    this.setState({ isSceneUpdated: false });
  }

  /**
   * Handle user is done editing scene.
   * @param {object} params Parameters.
   * @param {number|null} [editingScene] Id of scene that was edited.
   * @param {boolean} [skipChangingScene] If true, skip changing scene.
   */
  doneEditingScene(params, editingScene = null, skipChangingScene = false) {
    const scenes = this.context.params.scenes;
    editingScene = editingScene || this.state.editingScene;
    const isEditing = editingScene !== SceneEditingType.NEW_SCENE;

    // Add as start scene if this is the first scene we add
    if (!this.context.params.scenes.length) {
      this.setStartScene(params.sceneId);
    }

    this.context.params.scenes = updateScene(scenes, params, editingScene);

    if (this.scenePreview) {
      this.scenePreview.params.scenes = this.context.params.scenes;
    }

    // Set current scene
    const isChangingScene = !(skipChangingScene || isEditing);

    this.setState((prevState) => {
      return {
        isSceneUpdated: false,
        currentScene: isChangingScene ? params.sceneId : prevState.currentScene,
        editingScene: SceneEditingType.NOT_EDITING,
      };
    });
  }

  /**
   * Open dialog to confirm removal of interaction.
   * @param {number} [interactionIndex] Index of interaction to be removed.
   */
  removeInteraction(interactionIndex = null) {
    showConfirmationDialog({
      headerText: this.context.t('deleteInteractionTitle'),
      dialogText: this.context.t('deleteInteractionText'),
      cancelText: this.context.t('cancel'),
      confirmText: this.context.t('confirm'),
    }, this.confirmRemoveInteraction.bind(this, interactionIndex));
  }

  /**
   * Remove interaction
   * @param {number|null} [interactionIndex] Index of interaction to be removed.
   */
  confirmRemoveInteraction(interactionIndex = null) {
    let editingInteraction = interactionIndex;
    if (editingInteraction === null) {
      editingInteraction = this.state.editingInteraction;
    }

    // No interactions has been added yet
    if (editingInteraction === SceneEditingType.NEW_SCENE) {
      this.setState({ editingInteraction: SceneEditingType.NOT_EDITING });
      return;
    }

    const scenes = this.context.params.scenes;
    const scene = getSceneFromId(scenes, this.state.currentScene);
    scene.interactions.splice(editingInteraction, 1);

    this.setState({
      editingInteraction: SceneEditingType.NOT_EDITING,
      isSceneUpdated: false,
    });
  }

  /**
   * Edit interaction.
   * @param {object} params Parameters.
   * @param {object} sceneParams Scene parameters.
   */
  editInteraction(params, sceneParams = null) {
    // Creating scene as well
    if (sceneParams) {
      this.doneEditingScene(
        sceneParams,
        SceneEditingType.NEW_SCENE,
        true,
      );
    }

    const scenes = this.context.params.scenes;
    const scene = getSceneFromId(scenes, this.state.currentScene);
    if (!scene.interactions) {
      scene.interactions = [];
    }

    const isEditing = this.state.editingInteraction
      !== InteractionEditingType.NEW_INTERACTION;

    let interactionIndex = null;
    if (isEditing) {
      scene.interactions[this.state.editingInteraction] = params;
      interactionIndex = this.state.editingInteraction;
    }
    else {
      scene.interactions.push(params);
      interactionIndex = scene.interactions.length - 1;
    }
    this.scenePreview.trigger('focusInteraction', [interactionIndex, isEditing]);

    this.setState({
      editingInteraction: InteractionEditingType.NOT_EDITING,
      isSceneUpdated: false,
    });
    this.scenePreview.trigger('updateEditStateInteraction');
  }

  /**
   * Change to scene.
   * @param {number} sceneId Id of scene to change to.
   */
  changeScene(sceneId) {
    this.setState({
      isSceneUpdated: false,
      currentScene: sceneId,
      isSceneSelectorExpanded: false,
    });
  }

  /**
   * Set start scene.
   * @param {number} sceneId Id of scene to set as start scene.
   */
  setStartScene(sceneId) {
    this.context.params.startSceneId = sceneId;
    this.setState({
      startScene: sceneId,
    });
  }

  /**
   * Set a scene as initialized.
   */
  sceneIsInitialized() {
    this.setState({ isSceneUpdated: true });
  }

  /**
   * Create interaction.
   * @param {object} library Library for interaction.
   */
  createInteraction(library) {
    this.setState({
      editingInteraction: InteractionEditingType.NEW_INTERACTION,
      editingLibrary: library,
    });
  }

  /**
   * Handle updating the camera start position when button is pressed.
   */
  handleSetStartingPosition() {
    const camera = this.scenePreview.getCamera().camera;
    setScenePositionFromCamera(
      this.context.params.scenes,
      this.state.currentScene,
      camera
    );

    this.setState({ currentCameraPosition: `${camera.yaw},${camera.pitch}` });
  }

  /**
   * Get interaction.
   * @param {number} index Index of interaction to be retrieved.
   * @returns {object} Interaction.
   */
  getInteractionFromIndex(index) {
    const scenes = this.context.params.scenes;
    const scene = getSceneFromId(scenes, this.state.currentScene);
    return scene.interactions[index];
  }

  /**
   * Set scene preview for scene.
   * @param {Scene} scene Scene.
   */
  setScenePreview(scene) {
    this.scenePreview = scene;
    this.props.setScenePreview(scene);

    this.scenePreview.off('doubleClickedInteraction');
    this.scenePreview.on('doubleClickedInteraction', (event) => {
      const interactionIndex = event.data;
      const interaction = this.getInteractionFromIndex(interactionIndex);
      if (isGoToScene(interaction)) {
        this.changeScene(parseInt(interaction.action.params.nextSceneId));
        return;
      }

      this.setState({ editingInteraction: interactionIndex });
    });

    this.scenePreview.off('goToScene');
    this.scenePreview.on('goToScene', (event) => {
      const interaction = this.getInteractionFromIndex(event.data);
      if (!isGoToScene(interaction)) {
        return;
      }

      const nextSceneId = parseInt(interaction.action.params.nextSceneId);
      this.changeScene(nextSceneId);
    });

    this.scenePreview.off('editInteraction');
    this.scenePreview.on('editInteraction', (event) => {
      const interactionIndex = event.data;
      this.setState({
        editingInteraction: interactionIndex,
      });
    });

    this.scenePreview.off('deleteInteraction');
    this.scenePreview.on('deleteInteraction', (event) => {
      this.removeInteraction(event.data);
    });

    this.scenePreview.off('movestop');

    this.scenePreview.on('movestop', (event) => {
      if (!event.data) {
        return;
      }

      const isElementMovement = Boolean(event.data.target);
      if (isElementMovement) {
        const interaction = getInteractionFromElement(
          event.data.target,
          this.context.params.scenes,
          this.state.currentScene
        );

        updatePosition(interaction, event.data);
      }
      else {
      // The event was triggered by camera movement
        this.setState({
          currentCameraPosition: `${event.data.yaw},${event.data.pitch}`,
        });
      }
    });

    this.scenePreview.on('changedScene', (event) => {
      this.setState({ currentScene: event.data });
    });
  }

  /**
   * Toggle expansion of scene selector.
   * @param {boolean} [forceState] Optional state to set to.
   */
  toggleExpandSceneSelector(forceState) {
    // Disabled
    if (this.state.currentScene === null) {
      return;
    }

    this.setState((prevState) => {
      const isExpanded = forceState !== undefined
        ? forceState
        : !prevState.isSceneSelectorExpanded;

      return { isSceneSelectorExpanded: isExpanded };
    });
  }

  /**
   * Render component (React).
   * @returns {object} JSX element.
   */
  render() {
    const hasScenes = this.context.params.scenes.length > 0;
    const scene = getSceneFromId(
      this.context.params.scenes, this.state.currentScene
    );

    const isInStartingPosition =
      this.state.currentCameraPosition === null ||
      !scene ||
      scene.cameraStartPosition === this.state.currentCameraPosition;

    return (
      <div>
        <div className='scene-editor'>
          <InteractionsBar
            isShowing={this.state.isSceneUpdated && hasScenes}
            createInteraction={this.createInteraction.bind(this)}
          />
          <Scene
            isSceneUpdated={this.state.isSceneUpdated}
            sceneIsInitialized={this.sceneIsInitialized.bind(this)}
            setScenePreview={this.setScenePreview.bind(this)}
            currentScene={this.state.currentScene}
            hasOverlay={this.state.isSceneSelectorExpanded}
            onCloseOverlay={ () => {
              this.toggleExpandSceneSelector(false);
            } }
          />
        </div>
        <ControlBar
          currentScene={this.state.currentScene}
          editScene={this.editScene.bind(this)}
          cloneScene={this.cloneScene.bind(this)}
          deleteScene={this.deleteScene.bind(this)}
          newScene={this.editScene.bind(this)}
          changeScene={this.changeScene.bind(this)}
          setStartScene={this.setStartScene.bind(this)}
          startScene={this.state.startScene}
          onSetStartingPosition={ this.handleSetStartingPosition.bind(this) }
          isInStartingPosition={ isInStartingPosition }
          isSceneSelectorExpanded={this.state.isSceneSelectorExpanded}
          toggleExpandSceneSelector={this.toggleExpandSceneSelector.bind(this)}
        />
        {
          (this.state.editingScene !== SceneEditingType.NOT_EDITING) &&
          <SceneEditor
            removeAction={this.deleteScene.bind(this, this.state.editingScene)}
            doneAction={this.doneEditingScene.bind(this)}
            editingScene={this.state.editingScene}
            previewRect={
              this.scenePreview?.getRect() ?? { width: 16, height: 9 }
            }
          />
        }
        {
          this.state.editingInteraction !== InteractionEditingType.NOT_EDITING &&
          <InteractionEditor
            removeAction={this.removeInteraction.bind(this, this.state.editingInteraction)}
            doneAction={this.editInteraction.bind(this)}
            scenePreview={this.scenePreview}
            currentScene={this.state.currentScene}
            editingInteraction={this.state.editingInteraction}
            library={this.state.editingLibrary}
          />
        }
      </div>
    );
  }
}

Main.contextType = H5PContext;

Main.propTypes = {
  initialScene: PropTypes.number,
  setScenePreview: PropTypes.func.isRequired
};
