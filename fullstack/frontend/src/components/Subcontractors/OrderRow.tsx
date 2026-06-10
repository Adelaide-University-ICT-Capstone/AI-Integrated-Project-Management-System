// Author: Nevil Bhalodia
// Module: Subcontractors — order row component used in both By-Subcontractor and By-Service views
// Commit reference: refactor: extract Subcontractors page into modular components

// Single row in the orders table.
// Used in two slightly different layouts:
//   - "By Subcontractor" view  → no Subcontractor column (we already
//     know who the orders belong to from the parent card)
//   - "By Service" view        → includes Subcontractor column
// The `showSubcontractor` prop toggles between the two.

import { useNavigate } from '@tanstack/react-router'
import { Trash2 } from 'lucide-react'
import type { Order } from './types'
import {
  ROW_COLS_BY_SC,
  ROW_COLS_BY_SVC,
  alertToneClass,
  statusPillClass,
} from './constants'
import {
  formatDaysAgo,
  getOrderAlert,
  getServicePillClass,
  mapMaterialStatus,
} from './utils'

interface OrderRowProps {
  order: Order
  showSubcontractor?: boolean
  subcontractorName?: string
  onDelete: () => void
}

export function OrderRow({
  order,
  showSubcontractor = false,
  subcontractorName = '',
  onDelete,
}: OrderRowProps) {
  const navigate = useNavigate()
  const alert = getOrderAlert(order)
  const cols = showSubcontractor ? ROW_COLS_BY_SVC : ROW_COLS_BY_SC

  // Clicking anywhere on the row navigates to the parent project.
  // The delete button stops propagation so it doesn't trigger the row click.
  const handleRowClick = () => {
    navigate({ to: `/projects/${order.projectId}` })
  }

  return (
    <div
      onClick={handleRowClick}
      className={`grid ${cols} gap-2 px-4 py-2 items-center text-xs border-b border-gray-100 dark:border-gray-700 last:border-b-0 hover:bg-blue-50 dark:hover:bg-blue-900/20 cursor-pointer transition-colors`}
    >
      {showSubcontractor && (
        <span className="font-medium text-gray-900 dark:text-white truncate text-xs">
          {subcontractorName}
        </span>
      )}

      <span className="font-mono text-blue-700 dark:text-blue-400 text-[11px] truncate">
        {order.projectId}
      </span>

      <span
        className={`justify-self-center px-2 py-0.5 rounded text-[10px] font-medium whitespace-nowrap ${getServicePillClass(order.service)}`}
      >
        {order.service}
      </span>

      <span className="justify-self-center text-gray-600 dark:text-gray-400 whitespace-nowrap">
        {formatDaysAgo(order.orderedDate)}
      </span>

      <span
        className={`justify-self-center px-2 py-0.5 rounded-full text-[10px] font-medium whitespace-nowrap ${statusPillClass[mapMaterialStatus(order.status)]}`}
      >
        {order.status}
      </span>

      <span
        className={`justify-self-center px-2 py-0.5 rounded text-[10px] font-medium whitespace-nowrap ${alertToneClass[alert.tone]}`}
      >
        {alert.label}
      </span>

      <button
        onClick={(e) => {
          // Prevent the row's onClick from firing when the delete button
          // is pressed — without this the user would be navigated to the
          // project page immediately after deleting the order.
          e.stopPropagation()
          onDelete()
        }}
        className="p-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded justify-self-center"
        aria-label="Delete order"
      >
        <Trash2 size={14} />
      </button>
    </div>
  )
}