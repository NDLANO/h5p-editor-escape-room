import React from 'react';
import ReactDOM from 'react-dom';
import Main from './components/Main';
import { H5PContext } from './context/H5PContext';
import './playlist-widget/widget';

H5PEditor.widgets.NDLAthreeImage = H5PEditor.NDLAThreeImage = (function () {

  function ThreeImage(parent, field, params, setValue) {
    this.params = params || {};
    this.params = Object.assign({
      scenes: [],
    }, this.params);
    this.parent = parent;
    this.field = field;
    this.setValue = setValue;
    this.wrapper = null;

    /**
     * Help fetch the correct translations.
     *
     * @param {string[]} args
     * @return {string}
     */
    this.t = function t(...args) {
      const translations = ['H5PEditor.NDLAThreeImage', ...args];
      return H5PEditor.t.apply(window, translations);
    };

    this.appendTo = function ($container) {
      const wrapper = document.createElement('div');
      wrapper.classList.add('h5p-editor-three-image-wrapper');
      this.wrapper = wrapper;

      $container[0].appendChild(wrapper);

      setValue(field, this.params);

      let startScene = this.params.scenes.length ? 0 : null;
      if (this.params.scenes.length) {
        startScene = this.params.startSceneId;
      }

      ReactDOM.render(
        <H5PContext.Provider value={this}>
          <Main initialScene={startScene} />
        </H5PContext.Provider>,
        wrapper
      );
    };

    this.resize = () => {
      if (!this.wrapper) {
        return;
      }

      const mobileThreshold = 815;
      const wrapperSize = this.wrapper.getBoundingClientRect();
      if (wrapperSize.width < mobileThreshold) {
        this.wrapper.classList.add('mobile');
      }
      else {
        this.wrapper.classList.remove('mobile');
      }
    };

    this.ready = (ready) => {
      if (this.passReadies) {
        parent.ready(ready);
      }
      else {
        this.readies.push(ready);
      }
    };

    this.validate = function () {
      return true;
    };

    H5P.$window.on('resize', this.resize.bind(this));
    this.resize();
  }

  return ThreeImage;
})();
