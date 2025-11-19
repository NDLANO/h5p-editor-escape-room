import React from 'react';
import PropTypes from 'prop-types';
import EditingDialog from '@components/EditingDialog/EditingDialog.js';
import { H5PContext } from '@context/H5PContext.js';
import { getPlaylistFromId } from '@h5phelpers/playlistParams.js';
import {
  createPlaylistForm,
  getDefaultPlaylistParams,
  validatePlaylistForm
} from '@h5phelpers/forms/playlistForm.js';
import { getFocussableElements } from '@scripts/utils/dom.js';
import './PlaylistEditor.scss';

export const PlaylistEditingType = {
  NOT_EDITING: null,
  NEW_PLAYLIST: '',
};

export default class PlaylistEditor extends React.Component {
  /**
   * @class
   * @param {object} props React props.
   */
  constructor(props) {
    super(props);
    this.props = props;

    this.semanticsRef = React.createRef();

    this.state = {
      library: null,
      hasInputError: false,
    };
  }

  /**
   * Get playlist parameters.
   * @returns {object} Playlist parameters.
   */
  getPlaylistParams() {
    // New playlist
    return (this.props.editingPlaylist === PlaylistEditingType.NEW_PLAYLIST) ?
      getDefaultPlaylistParams() :
      getPlaylistFromId(this.props.playlists, this.props.editingPlaylist);
  }

  /**
   * Handle component did mount (React).
   */
  componentDidMount() {
    this.params = this.getPlaylistParams();

    const contextParent = this.props.context.parent;

    // Preserve parent's children
    this.parentChildren = contextParent && contextParent.children;

    createPlaylistForm(
      this.props.context.field,
      this.params,
      this.semanticsRef.current,
      contextParent
    );

    // Capture own children and restore parent
    this.children = this.props.context.parent.children;
    this.props.context.parent.children = this.parentChildren;

    // Focus first field
    getFocussableElements(this.semanticsRef.current)?.shift()?.focus();
  }

  /**
   * Handle done editing.
   */
  handleDone() {
    const isValid = validatePlaylistForm(this.children);
    if (!isValid || !this.params.audioTracks) {
      return;
    }

    this.props.doneAction(this.params);
  }

  /**
   * Handle confirm done editing.
   */
  confirmDone() {
    this.props.doneAction(this.params);
  }

  /**
   * Remove input errors.
   */
  removeInputErrors() {
    this.setState({ hasInputError: false });
  }

  /**
   * Render component (React).
   * @returns {object} JSX.
   */
  render() {
    const semanticsClasses = ['semantics-wrapper'];
    semanticsClasses.push('choose-playlist-editor');

    return (
      <EditingDialog
        title={this.props.translate('playlist')}
        titleClasses={['playlist']}
        removeAction={this.props.removeAction}
        doneAction={this.handleDone.bind(this)}
        doneLabel={this.props.translate('done')}
        removeLabel={this.props.translate('remove')}
        resize={() => {
          this.props.resize?.();
        }}
      >
        <div className={semanticsClasses.join(' ')} ref={this.semanticsRef}/>
      </EditingDialog>
    );
  }
}

PlaylistEditor.contextType = H5PContext;

PlaylistEditor.propTypes = {
  editingPlaylist: PropTypes.string.isRequired,
  doneAction: PropTypes.func.isRequired,
  removeAction: PropTypes.func.isRequired,
  resize: PropTypes.func,
  translate: PropTypes.func.isRequired,
  playlists: PropTypes.arrayOf(PropTypes.shape({
    playlistId: PropTypes.string,
  })).isRequired,
  context: PropTypes.object.isRequired,
};
