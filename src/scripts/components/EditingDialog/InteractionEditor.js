import React from 'react';
import PropTypes from 'prop-types';
import EditingDialog from './EditingDialog.js';
import { H5PContext } from '@context/H5PContext.js';
import { SceneTypes } from '@components/Scene/Scene.js';
import { getDefaultLibraryParams, isGoToScene } from '@h5phelpers/libraryParams.js';
import { getSceneFromId } from '@h5phelpers/sceneParams.js';
import { getLibraryDataFromFields } from '@h5phelpers/editorForms.js';
import {
  createInteractionForm,
  sanitizeInteractionParams,
  validateInteractionForm
} from '@h5phelpers/forms/interactionForm.js';
import GoToSceneWrapper from './GoToScene/GoToSceneWrapper.js';
import { sanitizeSceneForm, sanitizeInteractionGeometry, validateSceneForm } from '@h5phelpers/forms/sceneForm.js';
import './InteractionEditor.scss';

export const InteractionEditingType = {
  NOT_EDITING: null,
  NEW_INTERACTION: -1,
};

export default class InteractionEditor extends React.Component {
  /**
   * @param {object} props Props (React).
   * @param {number} props.currentScene Current scene id.
   * @param {object} props.library Library.
   * @param {object} props.scenePreview View instance.
   * @param {number} props.editingInteraction Indicator for interaction edited.
   * @param {function} props.doneAction Callback for when user end editing.
   * @param {function} props.removeAction Callback to remove interaction.
   */
  constructor(props) {
    super(props);
    this.props = props;
    this.semanticsRef = React.createRef();

    this.state = {
      library: null,
      isInitialized: false,
      hasInputError: false,
    };

    this.props = props;
  }

  /**
   * Get interaction by index.
   * @param {number} interactionIndex Interaction index.
   * @returns {object} Interaction.
   */
  getInteractionParams(interactionIndex = null) {
    const isNewScene = interactionIndex === InteractionEditingType.NEW_INTERACTION;

    if (isNewScene) {
      return getDefaultLibraryParams(this.props.library.uberName);
    }

    const scenes = this.context.params.scenes;
    const scene = getSceneFromId(scenes, this.props.currentScene);
    return scene.interactions[interactionIndex];
  }

  /**
   * Get default position for interaction.
   * @returns {string} Default position.
   */
  getDefaultInteractionPosition() {
    const scenes = this.context.params.scenes;
    const scene = getSceneFromId(scenes, this.props.currentScene);

    if (scene.sceneType === SceneTypes.STATIC_SCENE) {
      // Place it in image center
      // % denotes that its placed on a static image.
      return '50%,50%';
    }

    const camera = this.props.scenePreview.getCamera();
    const yaw = camera.camera.yaw;
    const pitch = camera.camera.pitch;

    return `${yaw},${pitch}`;
  }

  /**
   * React life-cycle-function: Component did mount.
   */
  async componentDidMount() {
    this.params = this.getInteractionParams(this.props.editingInteraction);
    const field = this.context.field;

    // Preserve parent's children
    this.parentChildren = this.context.parent.children;

    createInteractionForm(
      field,
      this.params,
      this.semanticsRef.current,
      this.context.parent,
    );

    // Restore parent's children after preserving our own
    this.children = this.context.parent.children;
    this.context.parent.children = this.parentChildren;

    // Update state when library has loaded
    this.libraryWidget = this.children[2];

    this.libraryWidget = this.children?.find?.((child) => {
      return child.field?.name === 'action';
    });

    const libraryLoadedCallback = () => {
      this.setState({ isInitialized: true });
    };

    // Check if children has been loaded, since ready() doesn't work for library
    if (this.libraryWidget.children?.length) {
      libraryLoadedCallback();
    }
    else {
      this.libraryWidget.change(libraryLoadedCallback.bind(this));
    }

    const library = await getLibraryDataFromFields(
      field, this.params.action.library
    );

    this.setState({ library: library });
  }

  /**
   * Handle user done editing interaction.
   */
  handleDone() {
    const interactionIndex = this.props.editingInteraction;
    let interactionPosition = null;

    // Set default position if new interaction
    if (interactionIndex === InteractionEditingType.NEW_INTERACTION) {
      interactionPosition = this.getDefaultInteractionPosition();
    }

    if (this.scene) {
      // Return if scene is invalid
      const isValidScene = this.validateScene();
      if (!isValidScene) {
        return;
      }
    }

    this.params = sanitizeInteractionParams(
      this.params, interactionPosition
    );

    // There is only a default size suitable for 3D scenes. Convert to 2D.
    const scene = getSceneFromId(
      this.context.params.scenes,
      this.props.currentScene
    );

    if (
      scene.sceneType === 'static' &&
      this.params.label &&
      this.params.showAsHotspot
    ) {
      sanitizeInteractionGeometry({
        interaction: this.params,
        sceneType: scene.sceneType,
        cameraPos: scene.cameraStartPosition,
        previewSize: this.props.scenePreview.getRect(),
        previousSceneType: scene.sceneType
      });
    }

    const isValid = validateInteractionForm(this.children);

    // Return to form with error messages if form is invalid
    if (!isValid) {
      this.setState({
        hasInputError: true,
      });
      return;
    }

    this.props.doneAction(this.params, this.scene && this.scene.params);
  }

  /**
   * Validate scene.
   * @returns {boolean} True, if scene is valid. Else false.
   */
  validateScene() {
    const isValid = validateSceneForm(this.scene.children);
    if (!isValid) {
      return false;
    }

    const { sceneType } = this.scene.params;

    sanitizeSceneForm(
      this.scene.params,
      sceneType,
      this.scene.params.cameraStartPosition
    );
    return true;
  }

  /**
   * Remove error messages from form.
   */
  removeInputErrors() {
    this.setState({
      hasInputError: false,
    });
  }

  /**
   * Set scene.
   * @param {object} scene Scene.
   */
  setScene(scene) {
    this.scene = scene;
  }

  /**
   * React render function.
   * @returns {object} JSX element.
   */
  render() {
    let title = '';
    let className = '';

    if (this.state.library) {
      title = this.state.library.title;
      className = this.state.library.name
        .toLowerCase()
        .replace('.', '-');
    }

    const semanticsClasses = ['semantics-wrapper'];
    if (this.state.isInitialized && isGoToScene(this.params)) {
      semanticsClasses.push('go-to-scene');
    }

    return (
      <EditingDialog
        title={title}
        titleClasses={[className]}
        removeAction={this.props.removeAction}
        doneAction={this.handleDone.bind(this)}
        doneLabel={this.context.t('done')}
        removeLabel={this.context.t('remove')}
      >
        <div className={semanticsClasses.join(' ')} ref={this.semanticsRef}/>
        {
          this.state.isInitialized && isGoToScene(this.params) &&
          <GoToSceneWrapper
            selectedScene={this.removeInputErrors.bind(this)}
            hasInputError={this.state.hasInputError}
            nextSceneIdWidget={this.libraryWidget.children[0]}
            currentScene={this.props.currentScene}
            params={this.params}
            setScene={this.setScene.bind(this)}
          />
        }
      </EditingDialog>
    );
  }
}

InteractionEditor.contextType = H5PContext;

InteractionEditor.propTypes = {
  currentScene: PropTypes.number.isRequired,
  library: PropTypes.shape({
    uberName: PropTypes.string.isRequired,
  }),
  scenePreview: PropTypes.shape({
    getCamera: PropTypes.func.isRequired,
  }),
  editingInteraction: PropTypes.oneOfType([
    PropTypes.number,
    PropTypes.oneOf(Object.values(InteractionEditingType)),
  ]),
  doneAction: PropTypes.func.isRequired,
  removeAction: PropTypes.func.isRequired,
};
