// Materials & Subcontractor Orders section on the Project Details page.
// Shows a grid of material cards — Survey / Soil Testing / Timber Framing
// are pre-loaded as defaults (per Harri's spec) and can't be deleted.
// User-added materials get a hover-revealed X button to remove them.
// Each card has inline editors for the three editable fields:
//   - Subcontractor (dropdown from SUBCONTRACTORS list)
//   - When Ordered (date picker)
//   - Status (N/A / Ordered / Received / By Client)

import { Package, Plus, X } from 'lucide-react'
import type { Material, MaterialStatus } from './types'
import { SUBCONTRACTORS } from './constants'
import { getMaterialStatusPillClass } from './utils'

interface MaterialsSectionProps {
  materials: Material[]
  // Click handlers wired up by the parent route.
  onOpenAddMaterial: () => void
  onRemoveMaterial: (index: number) => void
  onUpdateMaterialField: <K extends keyof Material>(
    index: number,
    field: K,
    value: Material[K],
  ) => void
}

export function MaterialsSection({
  materials,
  onOpenAddMaterial,
  onRemoveMaterial,
  onUpdateMaterialField,
}: MaterialsSectionProps) {
  return (
    <div>
      {/* Section header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <Package size={20} /> Materials &amp; Subcontractor Orders
        </h3>
        <button
          onClick={onOpenAddMaterial}
          className="flex items-center gap-2 px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus size={16} /> Add Material
        </button>
      </div>

      {/* Responsive grid: 1 column on mobile, 2 on tablet, 3 on desktop. */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {materials.map((material, index) => (
          <MaterialCard
            key={index}
            material={material}
            onRemove={() => onRemoveMaterial(index)}
            onUpdateField={(field, value) =>
              onUpdateMaterialField(index, field, value)
            }
          />
        ))}
      </div>
    </div>
  )
}

// ----- Internal material card -----
// Pulled out as a sub-component so the parent JSX stays readable.
// Not exported because it's only used inside MaterialsSection.

interface MaterialCardProps {
  material: Material
  onRemove: () => void
  // Generic field updater so callers can change name/subcontractor/etc.
  // through one entry point and the type system enforces the value
  // matches the field.
  onUpdateField: <K extends keyof Material>(field: K, value: Material[K]) => void
}

function MaterialCard({ material, onRemove, onUpdateField }: MaterialCardProps) {
  return (
    <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 relative group">
      {/* Card header: icon + name + Default badge + status pill */}
      <div className="flex items-start justify-between mb-3 gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <Package
            size={18}
            className="text-gray-400 flex-shrink-0"
          />
          <h4 className="font-medium text-gray-900 dark:text-white text-sm truncate">
            {material.name}
          </h4>
          {material.isDefault && (
            <span className="text-[9px] font-semibold uppercase tracking-wide px-1.5 py-0.5 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 rounded">
              Default
            </span>
          )}
        </div>
        <span
          className={`text-xs font-medium px-2 py-0.5 rounded-full whitespace-nowrap ${getMaterialStatusPillClass(material.status)}`}
        >
          {material.status}
        </span>
      </div>

      {/* Three editable fields stacked vertically */}
      <div className="space-y-2">
        <div>
          <label className="text-[10px] uppercase tracking-wide text-gray-500 dark:text-gray-400 font-medium">
            Subcontractor
          </label>
          <select
            value={material.subcontractor}
            onChange={(e) => onUpdateField('subcontractor', e.target.value)}
            className="w-full mt-0.5 px-2 py-1 text-xs border border-gray-200 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          >
            <option value="">Select subcontractor...</option>
            {SUBCONTRACTORS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-[10px] uppercase tracking-wide text-gray-500 dark:text-gray-400 font-medium">
            When Ordered
          </label>
          <input
            type="date"
            value={material.orderedDate}
            onChange={(e) => onUpdateField('orderedDate', e.target.value)}
            className="w-full mt-0.5 px-2 py-1 text-xs border border-gray-200 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          />
        </div>

        <div>
          <label className="text-[10px] uppercase tracking-wide text-gray-500 dark:text-gray-400 font-medium">
            Status
          </label>
          <select
            value={material.status}
            onChange={(e) =>
              onUpdateField('status', e.target.value as MaterialStatus)
            }
            className="w-full mt-0.5 px-2 py-1 text-xs border border-gray-200 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          >
            <option value="N/A">N/A</option>
            <option value="Ordered">Ordered</option>
            <option value="Received">Received</option>
            <option value="By Client">By Client</option>
          </select>
        </div>
      </div>

      {/* Hover-revealed remove button — only for non-default items.
          Default items (Survey, Soil Testing, Timber Framing) are
          required for every project, so we hide the button completely
          rather than showing a disabled one. */}
      {!material.isDefault && (
        <button
          onClick={onRemove}
          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 p-1 bg-red-100 text-red-600 rounded-full hover:bg-red-200 transition-opacity"
          title="Remove material"
        >
          <X size={12} />
        </button>
      )}
    </div>
  )
}

// Default export to match TanStack Router code-splitting expectations.
export default MaterialsSection
