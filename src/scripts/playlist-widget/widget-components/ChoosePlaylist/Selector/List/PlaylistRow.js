import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { H5PContext } from '@context/H5PContext.js';
import './PlaylistRow.scss';

export default class PlaylistRow extends Component {
  /**
   * @class
   * @param {object} props Props (React).
   */
  constructor(props) {
    super(props);
    this.props = props;

    this.imageRef = React.createRef();

    this.state = {
      isVerticalImage: false,
    };
  }

  /**
   * Handle image loaded and set orientation state.
   */
  onImageLoad() {
    const image = this.imageRef.current;
    const ratio = 4 / 3;

    this.setState({
      isVerticalImage: image.naturalWidth / image.naturalHeight < ratio,
    });
  }

  /**
   * Handle click on playlist.
   */
  onPlaylistClick() {
    if (this.props.onPlaylistClick) {
      this.props.onPlaylistClick(this.props.playlist.playlistId);
    }
  }

  /**
   * Handle click on title.
   */
  onTitleClick() {
    if (this.props.onTitleClick) {
      this.props.onTitleClick(this.props.playlist.playlistId);
    }
  }

  /**
   * Render component (React).
   * @returns {object} JSX.
   */
  render() {
    const rowClasses = ['h5p-playlist-row'];

    if (this.props.isMarkedPlaylist) {
      rowClasses.push('marked-playlist');

      if (this.props.isShowingCheck) {
        rowClasses.push('checked');
      }
    }

    if (this.props.isAfterActivePlaylist) {
      rowClasses.push('no-top-border');
    }

    const imageClasses = ['playlist-thumbnail'];
    if (this.state.isVerticalImage) {
      imageClasses.push('vertical');
    }

    return (
      <li className='h5p-playlist-listitem'>
        <button
          type='button'
          className={rowClasses.join(' ')}
          onClick={this.onPlaylistClick.bind(this)}
        >
          <div className='playlist-wrapper'>
            <div
              className='h5p-playlist-name'
              onClick={this.onTitleClick.bind(this)}
              dangerouslySetInnerHTML={ { __html: this.props.playlist.title } }
            ></div>
          </div>
          {this.props.children}
        </button>
      </li>
    );
  }
}

PlaylistRow.contextType = H5PContext;

PlaylistRow.propTypes = {
  playlist: PropTypes.shape({
    title: PropTypes.string.isRequired,
    audioTracks: PropTypes.arrayOf(PropTypes.shape({
      path: PropTypes.string,
    })),
    playlistId: PropTypes.string.isRequired,
  }),
  isMarkedPlaylist: PropTypes.bool,
  isShowingCheck: PropTypes.bool,
  isAfterActivePlaylist: PropTypes.bool,
  onPlaylistClick: PropTypes.func,
  onTitleClick: PropTypes.func,
  children: PropTypes.node,
  playlistId: PropTypes.string,
};
