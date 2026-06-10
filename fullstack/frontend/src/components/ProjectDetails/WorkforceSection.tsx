// Author: Nevil Bhalodia
// Module: ProjectDetails — Workforce Allocation panel with member cards and add/remove
// Commit reference: refactor: extract Project Details page into modular components

// Workforce Allocation section on the Project Details page.
// Shows a grid of team member cards with:
//   - A coloured avatar circle with the member's initials
//   - Name, role and a status badge (active / available / etc.)
//   - A hover-revealed remove (minus) button
// If no members are added yet we render an empty-state placeholder
// matching the style of the workflow and materials sections.

import { Minus, Plus, Users } from 'lucide-react'
import type { WorkforceMember } from './types'
import { getWorkforceStatusColor } from './utils'

interface WorkforceSectionProps {
  workforce: WorkforceMember[]
  // Click handlers wired up by the parent route.
  onOpenAddWorker: () => void
  onRemoveWorker: (index: number) => void
}

export function WorkforceSection({
  workforce,
  onOpenAddWorker,
  onRemoveWorker,
}: WorkforceSectionProps) {
  return (
    <div>
      {/* Section header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <Users size={20} /> Workforce Allocation
        </h3>
        <button
          onClick={onOpenAddWorker}
          className="flex items-center gap-2 px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus size={16} /> Add Member
        </button>
      </div>

      {/* Member grid OR empty state */}
      {workforce.length === 0 ? (
        <div className="text-center py-8 bg-gray-50 dark:bg-gray-700/30 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600">
          <Users size={40} className="mx-auto text-gray-300 mb-2" />
          <p className="text-sm text-gray-500 dark:text-gray-400">
            No team members added yet
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {workforce.map((member, index) => (
            <MemberCard
              key={index}
              member={member}
              onRemove={() => onRemoveWorker(index)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// ----- Internal member card -----
// Pulled out so the parent JSX stays compact and the visual hover
// behaviour (remove button fade-in) is co-located with the card markup.

interface MemberCardProps {
  member: WorkforceMember
  onRemove: () => void
}

function MemberCard({ member, onRemove }: MemberCardProps) {
  return (
    <div className="flex items-center gap-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 relative group">
      {/* Coloured avatar circle with the member's initials.
          Background colour was assigned when the member was added
          (cycled through AVATAR_COLORS) so it stays consistent. */}
      <div
        className={`w-12 h-12 ${member.color} rounded-full flex items-center justify-center text-white font-bold`}
      >
        {member.avatar}
      </div>

      {/* Member text block — name, role, status badge */}
      <div className="flex-1 min-w-0">
        <h4 className="font-medium text-gray-900 dark:text-white truncate">
          {member.name}
        </h4>
        <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
          {member.role}
        </p>
        <span
          className={`inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-medium ${getWorkforceStatusColor(member.status)}`}
        >
          {member.status}
        </span>
      </div>

      {/* Remove button revealed on hover. Using opacity rather than
          conditional render so the layout doesn't shift when the
          cursor enters the card. */}
      <button
        onClick={onRemove}
        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 p-1 bg-red-100 text-red-600 rounded-full hover:bg-red-200 transition-opacity"
        aria-label="Remove member"
      >
        <Minus size={12} />
      </button>
    </div>
  )
}

// Default export alongside the named export — keeps TanStack Router's
// code-splitting plugin happy (same workaround as the other panels).
export default WorkforceSection