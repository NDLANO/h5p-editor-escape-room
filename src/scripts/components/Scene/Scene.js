import React from 'react';
import PropTypes from 'prop-types';
import NoScene from './NoScene';
import { H5PContext } from '@context/H5PContext.js';
import { initializeThreeSixtyPreview } from '@h5phelpers/h5pComponents.js';
import './Scene.scss';

export const SceneTypes = {
  THREE_SIXTY_SCENE: '360',
  PANORAMA_SCENE: 'panorama',
  STATIC_SCENE: 'static',
  NO_SCENE: null,
};

export default class Scene extends React.Component {
  /**
   * @class
   * @param {object} props React props.
   */
  constructor(props) {
    super(props);
    this.props = props;

    this.previewRef = React.createRef();

    this.state = {
      isInitialized: false,
    };
  }

  /**
   * React life-cycle handler: Component did mount.
   */
  componentDidMount() {
    this.initializePreview();
  }

  /**
   * React life-cycle handler: Component did update.
   */
  componentDidUpdate() {
    if (this.props.isSceneUpdated) {
      return;
    }

    if (!this.state.isInitialized) {
      this.initializePreview();
      return;
    }

    this.redrawScene();
  }

  /**
   * Set the scene in preview.
   */
  setAsActiveScene() {
    this.props.setScenePreview(this.preview);
    this.props.sceneIsInitialized();
  }

  /**
   * Redraw the scene.
   */
  redrawScene() {
    this.preview.setCurrentSceneId(this.props.currentScene);
    this.setAsActiveScene();
  }

  /**
   * Initialize preview.
   */
  initializePreview() {
    if (this.context.params.scenes.length <= 0) {
      return;
    }

    let params = {};
    if (this.context.parent instanceof H5PEditor.Form) {
      // Content is run standalone
      params = this.context.parent.params;
    }
    else if (this.context.parent instanceof H5PEditor.Library) {
      // Content is run as subcontent
      params = this.context.parent.params.params;
    }
    else {
      // Should never happen
      console.error('Virtual Tour: Parent is not main form or library');
    }

    this.preview = initializeThreeSixtyPreview(
      this.previewRef.current,
      params,
      {
        edit: this.context.t('edit'),
        delete: this.context.t('delete'),
        goToScene: this.context.t('goToScene'),
      }
    );

    this.setAsActiveScene();

    this.setState({
      isInitialized: true,
    });
  }

  /**
   * React render function.
   * @returns {object} JSX element.
   */
  render() {
    const sceneClasses = ['scene-wrapper'];
    const hasNoScenes = this.context.params.scenes.length <= 0;
    if (hasNoScenes) {
      sceneClasses.push('no-scenes');
    }

    return (
      <div className={sceneClasses.join(' ')}>
        {
          hasNoScenes &&
          <NoScene/>
        }
        <div className='scene-container' ref={this.previewRef} aria-hidden={ this.props.hasOverlay } />
        {
          this.props.hasOverlay &&
          <button
            className='scene-overlay'
            aria-label={ this.context.t('closeSceneSelector') }
            aria-controls={ 'scene-selector' }
            onClick={ this.props.onCloseOverlay }
          />
        }
      </div>
    );
  }
}

Scene.contextType = H5PContext;

Scene.propTypes = {
  isSceneUpdated: PropTypes.bool,
  hasOverlay: PropTypes.bool,
  currentScene: PropTypes.number,
  sceneIsInitialized: PropTypes.func.isRequired,
  setScenePreview: PropTypes.func.isRequired
};
