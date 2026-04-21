import React from 'react';
import { useSortable } from '@dnd-kit/react/sortable';
import { RestrictToVerticalAxis } from '@dnd-kit/abstract/modifiers';
import PropTypes from 'prop-types';
import './ContentsListItem.scss';

export const ContentsListItem = ({
  id,
  index,
  item,
  onAction = () => {},
  onFocusChanged = () => {},
  tabOrderMode = 'none'
}) => {
  /**
   * Handle double click on button.
   */
  const handleDoubleClick = () => {
    onAction(item.interactionId);
  };

  /**
   * Handle keydown on button.
   * @param {KeyboardEvent} event Keyboard event.
   */
  const handleKeyDown = (event) => {
    if (event.code !== 'Space' && event.code !== 'Enter') {
      return;
    }

    event.preventDefault();
    onAction(item.interactionId);
  };

  /**
   * Handle focus on button.
   */
  const handleFocus = () => {
    onFocusChanged(item.interactionId, true);
  };

  /**
   * Handle blur on button.
   */
  const handleBlur = () => {
    onFocusChanged(item.interactionId, false);
  };

  const isDraggingDisabled = tabOrderMode === 'none' || tabOrderMode === 'readingOrder';

  const { ref, handleRef } = useSortable({
    id: item.interactionId,
    index,
    modifiers: [RestrictToVerticalAxis],
    disabled: isDraggingDisabled,
  });

  return <div
    className='h5p-escape-room-editor-contents-list-item'
    id={ `h5p-escape-room-editor-contents-list-item-${id}` }
    ref={ isDraggingDisabled ? null : ref }
    onBlur={ handleBlur }
    onFocus={ handleFocus }
  >
    {!isDraggingDisabled && <span className='h5p-escape-room-editor-contents-list-item-handle' ref={handleRef} />}
    <button
      className='h5p-escape-room-editor-contents-list-item-button'
      onDoubleClick={ handleDoubleClick } // Intentionally double click to allow just highlighting interaction on click
      onKeyDown={ handleKeyDown }
    >
      <div className='h5p-escape-room-editor-contents-list-item-title'>{item.title}</div>
      <div className='h5p-escape-room-editor-contents-list-item-type'>{item.type}</div>
    </button>
  </div>;
};

ContentsListItem.propTypes = {
  id: PropTypes.string.isRequired,
  index: PropTypes.number.isRequired,
  item: PropTypes.object.isRequired,
  onAction: PropTypes.func,
  onFocusChanged: PropTypes.func,
  tabOrderMode: PropTypes.string
};
