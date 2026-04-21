import React, { useRef } from 'react';
import { DragDropProvider } from '@dnd-kit/react';
import { move } from '@dnd-kit/helpers';
import { ContentsListItem } from './ContentsListItem.js';

import './ContentsList.scss';
import PropTypes from 'prop-types';

export const ContentsList = ({
  data,
  onAction = () => {},
  onFocusChanged = () => {},
  onOrderChanged = () => {},
  tabOrderMode = 'none',
  maxHeight = null,
}) => {
  const uuids = useRef(new Map());

  /**
   * Handle start of item dragging.
   * @param {Event} event Event.
   */
  const handleDragStart = (event) => {
    const interactionIdOfDraggedElement = event.operation.source.id;
    data.forEach((item) => {
      onFocusChanged(item.interactionId, item.interactionId === interactionIdOfDraggedElement);
    });
  };

  /**
   * Handle end of item dragging.
   * @param {Event} event Event.
   */
  const handleDragEnd = (event) => {
    const reordered = move(data, event);
    onOrderChanged(reordered);

    reordered.forEach((item) => {
      onFocusChanged(item.interactionId, false);
    });
  };

  return (
    <DragDropProvider
      onDragStart={(event) => {
        handleDragStart(event);
      }}
      onDragEnd={(event) => {
        handleDragEnd(event);
      }}
    >
      <div
        className='h5p-escape-room-editor-contents-list'
        style={ maxHeight !== null ? { '--max-height': `${maxHeight}px` } : undefined }
      >
        {data.map((item, index) => {
          if (!uuids.current.has(item.interactionId)) {
            uuids.current.set(item.interactionId, H5P.createUUID());
          }

          return (
            <ContentsListItem
              index={ index }
              item={ item }
              id={ uuids.current.get(item.interactionId) }
              onAction={ onAction }
              onFocusChanged={ onFocusChanged }
              tabOrderMode={ tabOrderMode }
              key={ item.interactionId }
            />
          );
        })}
      </div>
    </DragDropProvider>
  );
};

ContentsList.propTypes = {
  data: PropTypes.array.isRequired,
  onAction: PropTypes.func,
  onFocusChanged: PropTypes.func,
  onOrderChanged: PropTypes.func,
  tabOrderMode: PropTypes.string,
  maxHeight: PropTypes.number,
};
