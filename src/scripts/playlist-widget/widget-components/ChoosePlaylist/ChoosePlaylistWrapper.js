import React, { Component } from 'react';
import PropTypes from 'prop-types';
import ChoosePlaylist from './Selector/ChoosePlaylist.js';
import { H5PContext } from '@context/H5PContext.js';

export default class ChoosePlaylistWrapper extends Component {
  /**
   * @class
   * @param {object} props React props.
   */
  constructor(props) {
    super(props);
    this.props = props;

    this.newPlaylist = React.createRef();

    this.state = {
      markedPlaylist: !this.props.canEdit ? this.props.markedPlaylist : null,
    };
  }

  /**
   * Set next playlist id.
   * @param {string} playlistId Playlist id to be set.
   */
  setNextPlaylistId(playlistId) {
    this.props.selectedPlaylist(playlistId);

    let newMarkedPlaylist =
      playlistId === this.state.markedPlaylist ? null : playlistId;

    if (this.props.canEdit) {
      this.props.editPlaylist(playlistId);
      newMarkedPlaylist = null;
    }

    this.setState({
      markedPlaylist: newMarkedPlaylist,
    });
  }

  /**
   * Render component (React).
   * @returns {object} JSX.
   */
  render() {
    const classes = ['choose-playlist-wrapper'];
    return (
      <div className={classes.join(' ')}>
        {
          <ChoosePlaylist
            params={this.props.params}
            playlists={this.props.playlists}
            markedPlaylist={this.state.markedPlaylist}
            hasInputError={this.props.hasInputError}
            setNextPlaylistId={this.setNextPlaylistId.bind(this)}
            noPlaylistsTranslation={this.props.noPlaylistsTranslation}
            translate={this.props.translate}
          />
        }
      </div>
    );
  }
}

ChoosePlaylistWrapper.contextType = H5PContext;

ChoosePlaylistWrapper.propTypes = {
  params: PropTypes.object,
  nextPlaylistIdWidget: PropTypes.object,
  hasInputError: PropTypes.bool,
  selectedPlaylist: PropTypes.func,
  editPlaylist: PropTypes.func,
  canEdit: PropTypes.bool,
  playlists: PropTypes.arrayOf(PropTypes.object),
  noPlaylistsTranslation: PropTypes.string.isRequired,
  translate: PropTypes.func.isRequired,
  markedPlaylist: PropTypes.string,
};
