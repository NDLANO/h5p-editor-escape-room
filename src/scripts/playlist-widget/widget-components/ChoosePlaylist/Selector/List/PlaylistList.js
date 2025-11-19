import PropTypes from 'prop-types';
import React from 'react';
import PlaylistRow from './PlaylistRow.js';

/**
 * @param {object} props Props (React).
 * @returns {object} JSX.Element.
 */
const PlaylistList = (props) => {
  let previousElementHasTopBorder = false;

  return (
    <ul className='h5p-playlist-list'>
      {
        props.playlists.map((playlist) => {
          const isMarkedPlaylist = playlist.playlistId === props.markedPlaylist;
          let isAfterActivePlaylist = previousElementHasTopBorder;
          previousElementHasTopBorder = isMarkedPlaylist;

          return (
            <PlaylistRow
              key={playlist.playlistId}
              playlist={playlist}
              isMarkedPlaylist={isMarkedPlaylist}
              isShowingCheck={props.isShowingCheck}
              isAfterActivePlaylist={isAfterActivePlaylist}
              onTitleClick={() => {
                props.onTitleClick
                && props.onTitleClick(playlist.playlistId);
              }}
              onPlaylistClick={() => {
                props.onPlaylistClick
                && props.onPlaylistClick(playlist.playlistId);
              }}
            />
          );
        })
      }
    </ul>
  );
};

PlaylistList.propTypes = {
  playlists: PropTypes.arrayOf(PropTypes.shape({
    playlistId: PropTypes.string,
  })),
  markedPlaylist: PropTypes.string,
  isShowingCheck: PropTypes.bool,
  onTitleClick: PropTypes.func,
  onPlaylistClick: PropTypes.func,
  children: PropTypes.func,
};

export default PlaylistList;
