import React from 'react';
import PropTypes from 'prop-types';
import PlaylistList from './List/PlaylistList.js';
import './ChoosePlaylistSelector.scss';

/**
 * Render component (React).
 * @param {object} props Props (React).
 * @returns {object} JSX.
 */
const ChoosePlaylistSelector = (props) => (
  <div className='choose-playlist-selector'>
    <PlaylistList
      playlists={props.playlists}
      markedPlaylist={props.markedPlaylist}
      onPlaylistClick={props.setNextPlaylistId.bind(this)}
      isShowingCheck={true}
    />
  </div>
);

ChoosePlaylistSelector.propTypes = {
  playlists: PropTypes.arrayOf(PropTypes.object).isRequired,
  markedPlaylist: PropTypes.string,
  setNextPlaylistId: PropTypes.func.isRequired
};

export default ChoosePlaylistSelector;
