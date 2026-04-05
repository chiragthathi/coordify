import React, { useRef } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'

export const VirtualizedList = ({
  items,
  estimateSize = 64,
  height = 480,
  overscan = 8,
  renderItem,
}) => {
  const parentRef = useRef(null)

  const rowVirtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => estimateSize,
    overscan,
  })

  const virtualRows = rowVirtualizer.getVirtualItems()

  return (
    <div
      ref={parentRef}
      style={{
        height,
        overflow: 'auto',
      }}
    >
      <div
        style={{
          height: `${rowVirtualizer.getTotalSize()}px`,
          position: 'relative',
          width: '100%',
        }}
      >
        {virtualRows.map((virtualRow) => {
          const item = items[virtualRow.index]

          return (
            <div
              key={virtualRow.key}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                transform: `translateY(${virtualRow.start}px)`,
              }}
            >
              {renderItem(item, virtualRow.index)}
            </div>
          )
        })}
      </div>
    </div>
  )
}
