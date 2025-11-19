import React from 'react';
import { createRoot } from 'react-dom/client';
import { updatePlaylist } from '@h5phelpers/playlistParams.js';
import ChoosePlaylistWrapper from './widget-components/ChoosePlaylist/ChoosePlaylistWrapper.js';
import PlaylistEditor, {
  PlaylistEditingType,
} from './widget-components/PlaylistEditor.js';
import PropTypes from 'prop-types';
import './widget.scss';

/** @typedef {{ playlistId: string, title: string, audioTracks: object }} Playlist */
/** @typedef {{ playlist: Playlist }} Scene */

export default class PlaylistWidget {
  /**
   * @class
   * @param {object} form Parent element in semantics.
   * @param {object} field Semantics field properties.
   * @param {object} value Parameters entered in editor form.
   * @param {function} setValue Callback to set parameters.
   */
  constructor(form, field, value, setValue) {
    this.form = form;
    this.field = field;
    this.value = value;
    this.setValue = setValue;
  }

  /**
   * @param {H5P.jQuery} $wrapper Wrapper to append to.
   */
  appendTo($wrapper) {
    this.wrapper = $wrapper.get(0);

    const root = createRoot(this.wrapper);
    root.render(
      <div
        className='h5p-playlist-settings-container'
      >
        <PlaylistWidgetComponent
          form={this.form}
          setValue={(/** @type {number} */ value) => {
            this.value = value;
            this.setValue(this.field, value);
          }}
          playlistId={this.value}
          label={this.field.label}
          description={this.field.description}
          canEdit={this.field.canEdit}
          resize={() => {
            this.resize();
          }}
        />
      </div>
    );
  }

  /**
   * Resize settings container to fit absolutely positioned overlay height.
   */
  resize() {
    this.settingsDOM = this.settingsDOM ??
      this.wrapper.querySelector('.h5p-playlist-settings-container');

    if (!this.settingsDOM) {
      return;
    }

    // Reset to browser computation and then apply overlay height if relevant
    this.settingsDOM.style.height = '';

    const overlayDOM = this.settingsDOM?.querySelector('.h5p-editing-overlay');
    if (!overlayDOM) {
      return;
    }

    window.requestAnimationFrame(() => {
      const settingsHeight = this.settingsDOM.getBoundingClientRect().height;
      const parentStyle = window.getComputedStyle(this.settingsDOM.parentNode);

      const overlayHeight = overlayDOM.getBoundingClientRect().height -
        parseFloat(parentStyle.getPropertyValue('padding-top')) -
        parseFloat(parentStyle.getPropertyValue('padding-bottom'));

      if (overlayHeight === 0) {
        return;
      }

      this.settingsDOM.style.height = `${Math.max(settingsHeight, overlayHeight)}px`;
    });
  }

  /**
   * Validate current values. Invoked by H5P core.
   * @returns {boolean} True, if current value is valid, else false.
   */
  validate() {
    return true;
  }

  /**
   * Placeholder for remove call.
   */
  remove() {}
}

class PlaylistWidgetComponent extends React.Component {
  /**
   * @class
   * @param {{
   *   form: object;
   *   setValue: (value: number) => void;
   *   playlistId: number;
   *   label: string;
   *   description: string;
   *   index: number;
   *   canEdit: boolean;
   *   resize: () => void;
   * }} props React props.
   */
  constructor(props) {
    super(props);
    this.props = props;

    this.newPlaylistButtonRef = React.createRef();

    const playlists = this.getPlaylists();

    this.state = {
      playlists,
      selectedPlaylist: playlists.find(
        (playlist) => playlist.playlistId === this.props.playlistId
      ),
      prevSelectedPlaylist: playlists.find(
        (playlist) => playlist.playlistId === this.props.playlistId
      ),
      isPlaylistsUpdated: false,
      editingPlaylist: PlaylistEditingType.NOT_EDITING,
    };
  }

  /**
   * Handle component did mount (React).
   */
  componentDidMount() {
    window.addEventListener(
      'h5pPlaylistsUpdated',
      (event) => {
        const updatedPlaylists = event.detail;

        const selectedPlaylistStillExists =
          this.state.selectedPlaylist &&
          updatedPlaylists.find(
            (playlist) =>
              playlist.playlistId === this.state.selectedPlaylist.playlistId
          );

        this.setState({
          playlists: updatedPlaylists,
        });

        if (!selectedPlaylistStillExists) {
          this.selectPlaylist(null);
        }
      }
    );
  }

  /**
   * Trigger vvent that updates the array of playlists.
   * @param {Playlist[]} updatedPlaylists Playlists.
   */
  triggerUpdatedEvent(updatedPlaylists) {
    window.dispatchEvent(new CustomEvent('h5pPlaylistsUpdated', {
      detail: updatedPlaylists,
    }));
  }

  /**
   * Help fetch the correct translations.
   * @param {string[]} args Arguments.
   * @returns {string} Translation.
   */
  translate(...args) {
    const translations = ['H5PEditor.EscapeRoom', ...args];
    return H5PEditor.t.apply(window, translations);
  }

  /**
   * Fetch current context.
   * @returns {object} context.
   */
  getContext() {
    const threeImage = this.props.form?.parent?.children?.find?.((child) => {
      return child.field?.name === 'threeImage';
    });

    return threeImage ?? this.props.form;
  }

  /**
   * Help fetch the current array of playlists.
   * @returns {Playlist[]} Playlist.
   */
  getPlaylists() {
    const root = this.props.form?.parent?.children || this.props.form?.children;

    const threeImage = root?.find?.((child) => {
      return child.field?.name === 'threeImage';
    });

    if (!threeImage) {
      return [];
    }

    if (threeImage.params?.playlists) {
      return threeImage.params.playlists;
    }
    else if (threeImage.parent?.params?.threeImage?.playlists) {
      return threeImage.parent.params.threeImage.playlists;
    }
    else if (threeImage.parent?.parent?.params?.threeImage?.playlists) {
      return threeImage.parent.parent.params.threeImage.playlists;
    }
    else if (threeImage.form?.parent?.params?.threeImage?.playlists) {
      return threeImage.form.parent.params.threeImage.playlists;
    }
    else if (this.props.form?.parent?.params?.threeImage?.playlists) {
      return this.props.form.parent.params.threeImage.playlists;
    }

    return [];
  }

  /**
   * Get all scenes.
   * @returns {Scene[]} Scene.
   */
  getScenes() {
    const threeImage = this.props.form?.parent?.children?.find?.((child) => {
      return child.field?.name === 'threeImage';
    });

    return threeImage?.form?.parent?.params?.threeImage?.scenes ?? [];
  }

  /**
   * Remove playlist.
   * @param {string} playlistId Playlist id.
   */
  removePlaylistFromGlobal(playlistId) {
    const threeImage = this.props.form;

    if (threeImage?.parent?.params?.behaviour?.playlist === playlistId) {
      threeImage.parent.params.behaviour.playlist = undefined;
    }
  }

  /**
   * Update playlists.
   * @param {Playlist[]} newPlaylists Playlists.
   */
  updatePlaylists(newPlaylists) {
    const threeImage = this.props.form.children[0];

    if (threeImage?.form?.parent?.params?.threeImage) {
      threeImage.form.parent.params.threeImage.playlists = newPlaylists;
    }
  }

  /**
   * Fetch current params.
   * @returns {object} params Parameters.
   */
  getParams() {
    const threeImage = this.props.form.children[0];

    if (threeImage?.params) {
      return threeImage.params;
    }

    if (threeImage?.parent?.parent?.params?.threeImage) {
      return threeImage.parent.parent.params.threeImage;
    }

    if (threeImage?.form?.parent?.params?.threeImage) {
      return threeImage.form.parent.params.threeImage;
    }

    return null;
  }

  /**
   * Set selected playlist.
   * @param {string} playlistId Playlist id.
   */
  selectPlaylist(playlistId) {
    const selectedPlaylist = this.state.playlists.find(
      (playlist) => playlist.playlistId === playlistId
    );

    const newMarkedPlaylist =
      selectedPlaylist !== this.state.prevSelectedPlaylist
        ? selectedPlaylist
        : null;
    const newPlaylistId =
      selectedPlaylist !== this.state.prevSelectedPlaylist
        ? playlistId
        : undefined;

    this.setState({
      selectedPlaylist: newMarkedPlaylist,
      prevSelectedPlaylist: newMarkedPlaylist,
    });

    this.props.setValue(newPlaylistId);
  }

  /**
   * Remove the given playlistId from the playlists array.
   * @param {Playlist[]} playlists Current playlists.
   * @param {Playlist} selectedPlaylist Playlist to be removed.
   * @returns {Playlist[]} playlists Filtered playlists.
   */
  removePlaylist(playlists = [], selectedPlaylist) {
    return playlists = playlists.filter(
      (playlist) => playlist !== selectedPlaylist
    );
  }

  /**
   * Remove given playlistId from the playlists array.
   * @param {string} playlistId Playlist id.
   * @returns {boolean} False if playlist was not added in the first place. Else true.
   */
  deletePlaylist(playlistId) {
    this.setFocusButton(this.buttonToRestoreFocusTo, -1);

    this.setState({
      editingPlaylist: PlaylistEditingType.NOT_EDITING,
    });

    // Playlist not added to params
    const isNewPlaylist = playlistId === PlaylistEditingType.NEW_PLAYLIST;
    if (isNewPlaylist) {
      return false;
    }

    const playlists = this.getPlaylists();
    const playlistToRemove = playlists.find((playlist) => {
      return playlist.playlistId === playlistId;
    });
    const newPlaylists = this.removePlaylist(
      playlists,
      playlistToRemove
    );
    this.updatePlaylists(newPlaylists);
    this.removePlaylistFromGlobal(playlistId);
    this.triggerUpdatedEvent(newPlaylists);

    // Remove playlistId from scenes that are using this playlist
    this.getScenes().forEach((scene) => {
      if (scene.playlist === playlistId) {
        scene.playlist = undefined;
      }
    });

    this.setState({
      playlistUpdated: false,
      selectedPlaylist: null,
    });

    return true;
  }

  /**
   * Sets chosen playlist as editingPlaylist.
   * @param {string} playlistId Playlist id of playlist to be edited.
   */
  editPlaylist(playlistId = PlaylistEditingType.NEW_PLAYLIST) {
    this.buttonToRestoreFocusTo = document.activeElement;
    this.setState({ editingPlaylist: playlistId });
  }

  /**
   * Update playlists array and states afte editing playlist.
   * @param {object} params Parameters.
   * @param {string} thisEditingPlaylist Editing state.
   */
  doneEditingPlaylist(params, thisEditingPlaylist = null) {
    const playlists = this.getPlaylists();
    thisEditingPlaylist = this.state.editingPlaylist;

    const newPlaylists = updatePlaylist(playlists, params, thisEditingPlaylist);
    this.updatePlaylists(newPlaylists);

    this.triggerUpdatedEvent(newPlaylists);

    this.setFocusButton(this.buttonToRestoreFocusTo);

    this.setState({
      playlistUpdated: false,
      editingPlaylist: PlaylistEditingType.NOT_EDITING,
      selectedPlaylist: null,
    });
  }

  /**
   * Set focus to button of playlist or fall back to new playlist button.
   * @param {HTMLButtonElement} button Button that was used to open dialog.
   * @param {number} [offset] Offset to select sibling.
   */
  setFocusButton(button, offset = 0) {
    if (!button?.isConnected || button === this.newPlaylistButtonRef.current) {
      this.newPlaylistButtonRef.current.focus(); // Fallback
      return;
    }

    if (typeof offset !== 'number' || offset === 0) {
      button.focus();
      return;
    }

    const list = button.closest('ul');
    if (!list) {
      this.newPlaylistButtonRef.current.focus();
      return;
    }

    const listItems = [...list.childNodes];

    const index = listItems.findIndex((listitem) => {
      return button.closest(`.${listitem.className}`) === listitem;
    });
    if (index === -1) {
      this.newPlaylistButtonRef.current.focus();
      return;
    }

    const newIndex = (index === 0 && offset < 0) ?
      1 :
      Math.max(0, index + offset);

    if (newIndex >= listItems.length) {
      this.newPlaylistButtonRef.current.focus();
      return;
    }

    listItems[newIndex]
      .querySelector(`.${button.className}`)?.focus();
  }

  /**
   * Render (React).
   * @returns {object} JSX of widget.
   */
  render() {
    window.requestAnimationFrame(() => {
      this.props.resize();
    });

    return (
      <>
        {this.props.label && (
          <span className="h5peditor-label">{this.props.label}</span>
        )}
        {this.props.description && (
          <span className="h5peditor-field-description">
            {this.props.description}
          </span>
        )}
        <ChoosePlaylistWrapper
          playlists={this.state.playlists}
          params={this.getParams()}
          noPlaylistsTranslation={this.translate('noPlaylistsAdded')}
          markedPlaylist={
            this.state.selectedPlaylist
              ? this.state.selectedPlaylist.playlistId
              : null
          }
          selectedPlaylist={this.selectPlaylist.bind(this)}
          editPlaylist={this.editPlaylist.bind(this)}
          canEdit={this.props.canEdit}
          translate={this.translate}
          context={this.getContext()}
          editingPlaylist={this.state.editingPlaylist}
          doneAction={this.doneEditingPlaylist.bind(this)}
        />
        {this.props.canEdit && (
          <div className="buttons-wrapper">
            <button
              className="h5p-new-playlist-button"
              onClick={() =>
                this.editPlaylist(PlaylistEditingType.NEW_PLAYLIST)
              }
              ref={this.newPlaylistButtonRef}
            >
              + {this.translate('newPlaylist')}
            </button>
          </div>
        )}
        {this.state.editingPlaylist !== PlaylistEditingType.NOT_EDITING &&
          this.props.canEdit && (
          <PlaylistEditor
            translate={this.translate}
            removeAction={() =>
              this.deletePlaylist(this.state.editingPlaylist)
            }
            doneAction={this.doneEditingPlaylist.bind(this)}
            editingPlaylist={this.state.editingPlaylist}
            context={this.getContext()}
            playlists={this.state.playlists}
            resize={() => {
              this.props.resize();
            }}
          />
        )}
      </>
    );
  }
}

H5PEditor.widgets.playlist = PlaylistWidget;

PlaylistWidgetComponent.propTypes = {
  form: PropTypes.object.isRequired,
  setValue: PropTypes.func.isRequired,
  playlistId: PropTypes.string,
  label: PropTypes.string,
  description: PropTypes.string,
  canEdit: PropTypes.bool.isRequired,
  resize: PropTypes.func.isRequired,
};
