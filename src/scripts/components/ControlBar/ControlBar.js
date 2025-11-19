import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { SceneEditingType } from '@components/EditingDialog/SceneEditor.js';
import { H5PContext } from '@context/H5PContext.js';
import { SceneTypes } from '@components/Scene/Scene.js';
import { getSceneFromId } from '@h5phelpers/sceneParams.js';
import SceneList from './SceneSelector/SceneList.js';
import SceneSelectorSubmenu from './SceneSelector/Row/Submenu/SceneSelectorSubmenu.js';
import SceneSelector from './SceneSelector/SceneSelector.js';
import './ControlBar.scss';

export default class ControlBar extends Component {
  /**
   * @class
   */
  constructor() {
    super();

    this.state = { setStartingPositionFocus: false };
  }

  /**
   * React render function.
   * @returns {object} JSX element.
   */
  render() {
    const scenes = this.context.params.scenes;
    const scene = getSceneFromId(scenes, this.props.currentScene);
    const is360Scene = scene && (
      scene.sceneType === SceneTypes.THREE_SIXTY_SCENE ||
      scene.sceneType === SceneTypes.PANORAMA_SCENE
    );

    const setStartingPositionButtonClasses = [
      'button-wrapper',
      this.props.isInStartingPosition ? '' : 'not-disabled',
      this.state.setStartingPositionFocus ? 'has-focus' : ''
    ].join(' ');

    return (
      <div className='h5p-control-bar'>
        <SceneSelector
          currentScene={this.props.currentScene}
          isExpanded={this.props.isSceneSelectorExpanded}
          toggleExpand={this.props.toggleExpandSceneSelector.bind(this)}
        >
          <SceneList
            scenes={this.context.params.scenes}
            startScene={this.props.startScene}
            markedScene={this.props.currentScene}
            onSceneClick={this.props.changeScene}
          >
            {(isStartScene, sceneId) => (
              <SceneSelectorSubmenu
                isStartScene={isStartScene}
                setStartScene={this.props.setStartScene.bind(this, sceneId)}
                onJump={this.props.changeScene.bind(this, sceneId)}
                onEdit={this.props.editScene.bind(this, sceneId)}
                onClone={this.props.cloneScene.bind(this, sceneId)}
                onDelete={this.props.deleteScene.bind(this, sceneId)}
                setStartingSceneLabel={this.context.t('setStartingScene')}
                goToSceneLabel={this.context.t('goToScene')}
                editLabel={this.context.t('edit')}
                cloneLabel={this.context.t('clone')}
                deleteLabel={this.context.t('delete')}
              />
            )}
          </SceneList>
        </SceneSelector>
        <div className='buttons-wrapper'>
          <button
            className='h5p-new-scene-button'
            onClick={this.props.newScene.bind(this, SceneEditingType.NEW_SCENE)}
          >+ {this.context.t('newScene')}</button>
          {
            is360Scene &&
            <div className={ setStartingPositionButtonClasses }>
              <button
                className='set-starting-position-button'
                onClick={ this.props.onSetStartingPosition }
                onFocus={ () => {
                  this.setState({ setStartingPositionFocus: true });
                } }
                onBlur={ () => {
                  this.setState({ setStartingPositionFocus: false });
                } }
                aria-describedby='set-starting-position-tooltip'
                disabled={ this.props.isInStartingPosition }
              >{this.context.t('setCameraStart')}</button>
              <div className="tooltip" id="set-starting-position-tooltip">
                <div className="text-wrapper">{this.context.t('setCameraStartTooltip')}</div>
              </div>
            </div>
          }
        </div>
      </div>
    );
  }
}

ControlBar.contextType = H5PContext;

ControlBar.propTypes = {
  currentScene: PropTypes.number,
  startScene: PropTypes.number,
  isSceneSelectorExpanded: PropTypes.bool.isRequired,
  toggleExpandSceneSelector: PropTypes.func.isRequired,
  newScene: PropTypes.func.isRequired,
  onSetStartingPosition: PropTypes.func.isRequired,
  changeScene: PropTypes.func.isRequired,
  setStartScene: PropTypes.func.isRequired,
  editScene: PropTypes.func.isRequired,
  cloneScene: PropTypes.func.isRequired,
  deleteScene: PropTypes.func.isRequired,
  isInStartingPosition: PropTypes.bool.isRequired,
};
