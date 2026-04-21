import React from 'react';
import { createRoot } from 'react-dom/client';
import Main from '@components/Main.js';
import { H5PContext } from '@context/H5PContext.js';
import '@scripts/playlist-widget/widget.js';

/**
 * Add listener to set `using-mouse` class on dom element when using mouse.
 * Not meant to be used more than once on same element.
 * @param {HTMLElement} domElement
 */
const addMouseUseListener = (domElement) => {
  if (!(domElement instanceof HTMLElement)) {
    return;
  }

  domElement.classList.add('using-mouse');
  ['mousedown', 'keydown', 'keyup'].forEach((eventName) => {
    domElement.addEventListener(eventName, (event) => {
      domElement.classList.toggle('using-mouse', event.type === 'mousedown');
    });
  });
};

export default class EscapeRoom {
  /**
   * @class
   * @param {object} parent Parent element in semantics.
   * @param {object} field Semantics field properties.
   * @param {object} params Parameters entered in editor form.
   * @param {function} setValue Callback to set parameters.
   */
  constructor(parent, field, params, setValue) {
    this.params = params || {};
    this.params = Object.assign({
      scenes: [],
    }, this.params);
    this.parent = parent;
    this.field = field;
    this.setValue = setValue;
    this.wrapper = null;

    window.addEventListener('resize', () => {
      this.scenePreview?.trigger('resize'); // View instance
      this.resize();
    });
    this.resize();
  }

  /**
   * Fetch correct translations.
   * @param {string[]} args Arguments.
   * @returns {string} Correct translation.
   */
  t(...args) {
    const translations = ['H5PEditor.EscapeRoom', ...args];
    return H5PEditor.t.apply(window, translations);
  }

  /**
   * Append field to wrapper. Invoked by H5P core.
   * @param {H5P.jQuery} $container Container to append to.
   */
  appendTo($container) {
    const wrapper = document.createElement('div');
    wrapper.classList.add('h5p-editor-escape-room-wrapper');
    addMouseUseListener(wrapper);
    this.wrapper = wrapper;

    $container[0].appendChild(wrapper);

    this.setValue(this.field, this.params);

    let startScene = this.params.scenes.length ? 0 : null;
    if (this.params.scenes.length) {
      startScene = this.params.startSceneId;
    }

    const root = createRoot(wrapper);
    root.render(
      <H5PContext.Provider value={this}>
        <Main
          initialScene={startScene}
          setScenePreview={(scenePreview) => {
            this.scenePreview = scenePreview;
          }}
          tabOrderMode={this.parent?.params.behaviour.tabOrderMode} // May be changed in the editor
        />
      </H5PContext.Provider>
    );
  }

  /**
   * Resize the editor.
   */
  resize() {
    if (!this.wrapper) {
      return;
    }

    const mobileThreshold = 815; // TODO: This should be replaced by container queries
    const wrapperSize = this.wrapper.getBoundingClientRect();
    if (wrapperSize.width < mobileThreshold) {
      this.wrapper.classList.add('mobile');
    }
    else {
      this.wrapper.classList.remove('mobile');
    }

    const sceneWrapper = this.wrapper.querySelector('.h5p-three-sixty-wrapper');
    if (sceneWrapper) {
      this.onContentsListResize?.(sceneWrapper.getBoundingClientRect().height);
    }
  }

  /**
   * Ready handler.
   * @param {function} ready Ready callback.
   */
  ready(ready) {
    if (this.passReadies) {
      parent.ready(ready);
    }
    else {
      this.readies.push(ready);
    }
  }

  /**
   * Validate current values. Invoked by H5P core.
   * @returns {boolean} True, if current value is valid, else false.
   */
  validate() {
    return true;
  }
}

H5PEditor.widgets.EscapeRoom = H5PEditor.EscapeRoom = EscapeRoom;
