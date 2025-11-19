import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { H5PContext } from '@context/H5PContext.js';
import ChoosePlaylistSelector from './ChoosePlaylistSelector.js';
import './ChoosePlaylist.scss';

export default class ChoosePlaylist extends Component {
  /**
   * Render component (React).
   * @returns {object} JSX.
   */
  render() {
    const playlistClasses = ['choose-playlist'];
    if (this.props.hasInputError) {
      playlistClasses.push('has-error');
    }

    const playlists = this.props.playlists;

    return (
      <div className={playlistClasses.join(' ')} >
        {
          playlists && playlists.length > 0 &&
          <div className='choose-playlist-selector-wrapper'>
            <ChoosePlaylistSelector
              playlists={playlists}
              markedPlaylist={this.props.markedPlaylist}
              setNextPlaylistId={this.props.setNextPlaylistId.bind(this)}
            />
          </div>
        }
        {
          (!playlists || playlists.length === 0) &&
          <div className='no-playlists'>{this.props.noPlaylistsTranslation}</div>
        }
      </div>
    );
  }
}

ChoosePlaylist.contextType = H5PContext;

ChoosePlaylist.propTypes = {
  markedPlaylist: PropTypes.string,
  hasInputError: PropTypes.bool,
  setNextPlaylistId: PropTypes.func,
  playlists: PropTypes.arrayOf(PropTypes.object),
  noPlaylistsTranslation: PropTypes.string.isRequired,
};
