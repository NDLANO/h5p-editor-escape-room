import React, { useContext, useMemo, useRef } from 'react';
import { DragDropProvider } from '@dnd-kit/react';
import { Accessibility, defaultPreset } from '@dnd-kit/dom';
import { move } from '@dnd-kit/helpers';
import { H5PContext } from '@context/H5PContext.js';
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
  const context = useContext(H5PContext);
  const uuids = useRef(new Map());
  const dataRef = useRef(data);
  dataRef.current = data;

  /**
   * Prepare localization of DnD-kit actions.
   */
  const plugins = useMemo(() => {
    const titleById = (id) => dataRef.current.find((item) => item.interactionId === id)?.title ?? '';

    return [
      ...defaultPreset.plugins.filter((plugin) => plugin !== Accessibility),
      Accessibility.configure({
        announcements: {
          dragstart: (event) => {
            const id = event.operation.source.id;
            const position = event.operation.source.index + 1;
            return context.t('dragStartTemplate')
              .replace('@title', titleById(id))
              .replace('@position', String(position))
              .replace('@total', String(dataRef.current.length));
          },
          dragover: (event) => {
            const { source, target } = event.operation;
            if (!target) {
              return undefined;
            }
            return context.t('dragOverTemplate')
              .replace('@title', titleById(source.id))
              .replace('@position', String(target.index + 1))
              .replace('@total', String(dataRef.current.length));
          },
          dragend: (event) => {
            const { source, canceled } = event.operation;
            const title = titleById(source.id);
            if (canceled) {
              return context.t('dragCancelTemplate').replace('@title', title);
            }
            return context.t('dragEndTemplate')
              .replace('@title', title)
              .replace('@position', String(source.index + 1))
              .replace('@total', String(dataRef.current.length));
          },
        },
        screenReaderInstructions: {
          draggable: context.t('draggableInstructions'),
        },
      }),
    ];
  }, [context]);

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
      plugins={ plugins }
      onDragStart={(event) => {
        handleDragStart(event);
      }}
      onDragEnd={(event) => {
        handleDragEnd(event);
      }}
    >
      <ul
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
      </ul>
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
