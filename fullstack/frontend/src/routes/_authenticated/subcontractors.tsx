import { AddSubcontractorModal } from '@/components/Subcontractors/AddSubcontractorModal'
import { NewOrderModal } from '@/components/Subcontractors/NewOrderModal'
import { OrderRow } from '@/components/Subcontractors/OrderRow'
import type { Order, ServiceType, Subcontractor } from '@/components/Subcontractors/types'
import { useEffect, useState } from 'react'
import {
  SERVICE_TYPES,
  ROW_COLS_BY_SC,
  ROW_COLS_BY_SVC,
  servicePillClass,
} from '@/components/Subcontractors/constants'

import {
  avatarColorFromName,
  daysBetween,
  getOrderAlert,
  initials,
  mapMaterialStatus,
  mapStringToServiceType,
  mapStatus,
} from '@/components/Subcontractors/utils'
import EditSubcontractorPanel from '@/components/Subcontractors/EditSubcontractorPanel'


import { createFileRoute, useNavigate } from '@tanstack/react-router'
import {
  Plus,
  Search,
  Building2,
  Mail,
  X,
  Send,
  Edit2,
  Trash2,
  LayoutGrid,
} from 'lucide-react'
import { toast } from 'sonner'
import { subcontractorsApi } from '@/api/subcontractors'
import { materialsApi } from '@/api/materials'
import type { Material } from '@/api/materials'
import { projectsApi } from '@/api/project'
import type { Project } from '@/api/project'

export const Route = createFileRoute('/_authenticated/subcontractors')({
  component: Subcontractors,
})


const mapMaterialToOrder = (material: Material): Order => ({
  id: material.id,
  projectId: material.project_id || '',
  subcontractorId: material.subcontractor_id || '',
  service: material.name || '',
  orderedDate: material.ordered_date || '',
  status: mapMaterialStatus(material.status),
})

// ----- Main Component -----

function Subcontractors() {
  const [subcontractors, setSubcontractors] = useState<Subcontractor[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [view, setView] = useState<'subcontractor' | 'service'>('subcontractor')
  const [searchTerm, setSearchTerm] = useState('')
  const [showAddSubcontractor, setShowAddSubcontractor] = useState(false)
  const [newOrderForSc, setNewOrderForSc] = useState<Subcontractor | null>(null)
  const [, setIsLoading] = useState(false)
  const totalActiveOrders = orders.length
  const followUpCount = orders.filter((o) => getOrderAlert(o).tone === 'red').length
  const overSevenDaysCount = orders.filter((o) => o.status === 'Ordered' && daysBetween(o.orderedDate) >= 7).length
  const [projects, setProjects] = useState<Project[]>([])
  const [editingSubcontractor, setEditingSubcontractor] = useState<Subcontractor | null>(null)

  useEffect(() => {

    const fetchSubcontractorData = async () => {
      try {
        setIsLoading(true)
        const [projectsData, subcontractorsData] = await Promise.all([
          projectsApi.getAllProjects(),
          subcontractorsApi.getSubcontractors(),
        ])

        setProjects(projectsData.data)

        const subcontractorsResult: Subcontractor[] = subcontractorsData.map((m: any) => ({
            id: m.id,
            name: m.company_name || '',
            email: m.contact_email || '',
            phone: m.phone || '',
            services: (m.specialty || '').split(',').map((s: string) => s.trim() as ServiceType).filter((s: ServiceType) => SERVICE_TYPES.includes(s)) || [],
          }))
        setSubcontractors(subcontractorsResult);


        // fetch all materials already scoped server-side to projects current user is assigned to
        const visibleMaterials = await materialsApi.getOrders()
        const visibleSubcontractorIds = new Set(subcontractorsResult.map((subcontractor) => subcontractor.id))
        // map API Material -> shared lightweight Order then convert fields to local UI types
        const uiOrders: Order[] = visibleMaterials
          .map(mapMaterialToOrder)
          .map((m) => ({
            id: m.id,
            subcontractorId: m.subcontractorId || '',
            service: (m.service ?? '') as string,
            projectId: m.projectId,
            orderedDate: m.orderedDate ?? '',
            status: mapMaterialStatus(m.status as any),
          }))
          .filter((order) => visibleSubcontractorIds.has(order.subcontractorId))
        setOrders(uiOrders)
      } catch (error) {
        toast.error('Failed to load subcontractors')
        console.error(error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchSubcontractorData()
  }, [])

  const handleUpdateSubcontractor = async (updated: Subcontractor) => {
    try {
      const saved = await subcontractorsApi.updateSubcontractor(updated.id, {
        company_name: updated.name,
        contact_email: updated.email,
        phone: updated.phone,
        specialty: updated.services.join(', '),
      })

      const frontendSc: Subcontractor = {
        id: saved.id,
        name: saved.company_name || '',
        email: saved.contact_email || '',
        phone: saved.phone || '',
        services: (saved.specialty || '')
          .split(',')
          .map((s: string) => s.trim() as ServiceType)
          .filter((s: ServiceType) => SERVICE_TYPES.includes(s)),
      }

      setSubcontractors((prev) =>
        prev.map((s) => (s.id === frontendSc.id ? frontendSc : s)),
      )
      setEditingSubcontractor(null)
      toast.success(`${frontendSc.name} updated`)
    } catch (error) {
      toast.error('Failed to update subcontractor')
      console.error(error)
    }
  }

  
  const matchSearch = (text: string) => text.toLowerCase().includes(searchTerm.toLowerCase())

  const handleAddSubcontractor = async (sc: Omit<Subcontractor, 'id'>) => {
    try {
      const apiPayload = {
        company_name: sc.name,
        contact_email: sc.email,
        phone: sc.phone,
        specialty: sc.services.join(', '),
      }
      const newSc = await subcontractorsApi.createSubcontractor(apiPayload)
      const frontendSc: Subcontractor = {
        id: newSc.id,
        name: newSc.company_name || '',
        email: newSc.contact_email || '',
        phone: newSc.phone || '',
        services: (newSc.specialty || '').split(',').map((s: string) => s.trim() as ServiceType).filter((s: ServiceType) => SERVICE_TYPES.includes(s)),
      }
      setSubcontractors([...subcontractors, frontendSc])
      toast.success(`${frontendSc.name} added`)
    } catch (error) {
      toast.error('Failed to add subcontractor')
      console.error(error)
    }
  }

  const handleAddOrder = async (order: Omit<Order, 'id'>) => {
    try {
      setIsLoading(true)
      const material = await materialsApi.createOrder(order.projectId, {
        project_id: order.projectId,
        name: order.service,
        status: mapStatus(order.status),
        subcontractor_id: order.subcontractorId,
        ordered_date: order.orderedDate,
      })

      // map returned material -> UI order using shared mapper then normalize UI fields
      const mapped = mapMaterialToOrder(material)
      const newOrder: Order = {
        id: mapped.id,
        subcontractorId: mapped.subcontractorId ?? '',
        service: mapStringToServiceType((mapped.service ?? '') as string),
        projectId: mapped.projectId,
        orderedDate: mapped.orderedDate ?? '',
        status: mapMaterialStatus(mapped.status as any),
      }
      setOrders((prev) => [...prev, newOrder])
      toast.success('Order created')
    } catch (error) {
      console.error('Error creating order:', error)
      toast.error('Failed to create order')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteOrder = (id: string) => {
    setOrders(orders.filter((o) => o.id !== id))
    toast.success('Order removed')
  }

  const handleDeleteSubcontractor = (id: string) => {
    if (window.confirm('Remove this subcontractor and all their orders?')) {
      setSubcontractors(subcontractors.filter((s) => s.id !== id))
      setOrders(orders.filter((o) => o.subcontractorId !== id))
      toast.success('Subcontractor removed')
    }
  }

  const filteredSubcontractors = subcontractors.filter((sc) =>
    matchSearch(sc.name) || sc.services.some((s) => matchSearch(s)),
  )

  const getProjectJobNumber = (projectId: string) =>
    projects.find((project) => project.project_id === projectId)?.job_number ?? projectId

  const getRowsForSubcontractor = (subcontractor: Subcontractor) => {
    const scOrders = orders
      .filter((o) => o.subcontractorId === subcontractor.id)
      .map((order) => ({
        ...order,
        projectJobNumber: getProjectJobNumber(order.projectId),
      }))
    return [...scOrders]
  }

  const visibleOrderRows = subcontractors.flatMap((subcontractor) =>
    getRowsForSubcontractor(subcontractor),
  )

  const ordersByService = SERVICE_TYPES.reduce((acc, service) => {
    acc[service] = visibleOrderRows.filter((o) => {
      const sc = subcontractors.find((s) => s.id === o.subcontractorId)
      const matches =
        matchSearch(o.projectId) ||
        matchSearch(o.projectJobNumber || '') ||
        (sc && matchSearch(sc.name)) ||
        matchSearch(o.service)
      return mapStringToServiceType(o.service) === service && matches
    })
    return acc
  }, {} as Record<ServiceType, Order[]>)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Subcontractors</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Cross-project order summary, grouped by subcontractor or service
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-6">
        {/* LEFT SIDE PANEL */}
        <aside className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 h-fit lg:sticky lg:top-4 space-y-4">
          <div>
            <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">View By</h3>
            <div className="space-y-1">
              <button
                onClick={() => setView('subcontractor')}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors text-left ${
                  view === 'subcontractor'
                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                <Building2 size={16} />
                <span className="flex-1">By Subcontractor</span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  view === 'subcontractor' ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                }`}>
                  {subcontractors.length}
                </span>
              </button>

              <button
                onClick={() => setView('service')}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors text-left ${
                  view === 'service'
                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                <LayoutGrid size={16} />
                <span className="flex-1">By Service</span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  view === 'service' ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                }`}>
                  {SERVICE_TYPES.length}
                </span>
              </button>
            </div>
          </div>

          <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
            <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Quick Stats</h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Total active orders</span>
                <span className="font-bold text-gray-900 dark:text-white">{totalActiveOrders}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Need follow-up</span>
                <span className="font-bold text-red-600">{followUpCount}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Ordered &gt;7 days</span>
                <span className="font-bold text-yellow-600">{overSevenDaysCount}</span>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
            <button
              onClick={() => setShowAddSubcontractor(true)}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
            >
              <Plus size={16} />
              Add Subcontractor
            </button>
          </div>
        </aside>

        {/* MAIN AREA */}
        <main className="space-y-4 min-w-0">
          {/* AI Coordination panel */}
          <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-xl border border-purple-200 dark:border-purple-800 p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 bg-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
                <Send className="text-white" size={18} />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 dark:text-white">AI-Powered Coordination</h3>
                <p className="text-xs text-gray-600 dark:text-gray-400">Day-based alerts following Harri's spec</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-white dark:bg-gray-800 p-3 rounded-lg">
                <div className="text-lg font-bold text-yellow-600">{overSevenDaysCount}</div>
                <div className="text-[11px] text-gray-600 dark:text-gray-400">Over 7 days · daily reminder</div>
              </div>
              <div className="bg-white dark:bg-gray-800 p-3 rounded-lg">
                <div className="text-lg font-bold text-red-600">{followUpCount}</div>
                <div className="text-[11px] text-gray-600 dark:text-gray-400">Follow-up needed (&gt;21d)</div>
              </div>
              <div className="bg-white dark:bg-gray-800 p-3 rounded-lg">
                <div className="text-lg font-bold text-green-600">98%</div>
                <div className="text-[11px] text-gray-600 dark:text-gray-400">On-time completion</div>
              </div>
            </div>
          </div>

          {/* Search bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={view === 'subcontractor' ? 'Search subcontractors...' : 'Search orders by project or service...'}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-sm"
            />
          </div>

          {/* VIEW: BY SUBCONTRACTOR */}
          {view === 'subcontractor' && (
            <div className="space-y-4">
              {filteredSubcontractors.length === 0 ? (
                <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
                  <Building2 size={48} className="mx-auto text-gray-400 mb-3" />
                  <p className="text-gray-600 dark:text-gray-400">No subcontractors match your search</p>
                </div>
              ) : (
                filteredSubcontractors.map((sc) => {
                  const scOrders = getRowsForSubcontractor(sc)
                  return (
                    <div key={sc.id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                      <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 dark:bg-gray-900/30 border-b border-gray-200 dark:border-gray-700">
                        <div className={`w-10 h-10 ${avatarColorFromName(sc.name)} rounded-lg flex items-center justify-center text-white font-bold text-sm flex-shrink-0`}>
                          {initials(sc.name)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-gray-900 dark:text-white">{sc.name}</h3>
                          <p className="text-xs text-gray-600 dark:text-gray-400 flex items-center gap-2 flex-wrap">
                            <span>{sc.services.join(', ')}</span>
                            <span>·</span>
                            <span>{scOrders.length} {scOrders.length === 1 ? 'order' : 'orders'}</span>
                            <span>·</span>
                            <span className="flex items-center gap-1"><Mail size={11} /> {sc.email}</span>
                          </p>
                        </div>
                        <div className="flex gap-2 flex-shrink-0">
                          <button
                            onClick={() => setEditingSubcontractor(sc)}
                            className="p-2 text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg"
                            title="Edit"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            onClick={() => handleDeleteSubcontractor(sc.id)}
                            className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                            title="Remove"
                          >
                            <Trash2 size={14} />
                          </button>
                          <button
                            onClick={() => setNewOrderForSc(sc)}
                            className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-xs font-medium whitespace-nowrap"
                          >
                            <Plus size={14} /> New Order
                          </button>
                        </div>
                      </div>

                      {scOrders.length === 0 ? (
                        <div className="px-4 py-6 text-center text-sm text-gray-500 dark:text-gray-400 italic">
                          No assigned projects yet
                        </div>
                      ) : (
                        <>
                          {/* Header row — uses SAME grid as data row */}
                          <div className={`grid ${ROW_COLS_BY_SC} gap-2 px-4 py-2 text-[10px] uppercase tracking-wide text-gray-500 dark:text-gray-400 font-semibold bg-gray-50 dark:bg-gray-900/30 border-b border-gray-200 dark:border-gray-700`}>
                            <span>Project</span>
                            <span className="justify-self-center">Service</span>
                            <span className="justify-self-center">Ordered</span>
                            <span className="justify-self-center">Status</span>
                            <span className="justify-self-center">Alert</span>
                            <span></span>
                          </div>
                          {scOrders.map((order) => (
                            <OrderRow
                              key={order.id}
                              order={order}
                              onDelete={() => handleDeleteOrder(order.id)}
                            />
                          ))}
                        </>
                      )}
                    </div>
                  )
                })
              )}
            </div>
          )}

          {/* VIEW: BY SERVICE */}
          {view === 'service' && (
            <div className="space-y-4">
              {SERVICE_TYPES.map((service) => {
                const svcOrders = ordersByService[service]
                return (
                  <div key={service} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                    <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 dark:bg-gray-900/30 border-b border-gray-200 dark:border-gray-700">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${servicePillClass[service]}`}>
                        {service}
                      </span>
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {svcOrders.length} {svcOrders.length === 1 ? 'order' : 'orders'} across projects
                      </span>
                    </div>

                    {svcOrders.length === 0 ? (
                      <div className="px-4 py-6 text-center text-sm text-gray-500 dark:text-gray-400 italic">
                        No active orders for {service.toLowerCase()}
                      </div>
                    ) : (
                      <>
                        <div className={`grid ${ROW_COLS_BY_SVC} gap-2 px-4 py-2 text-[10px] uppercase tracking-wide text-gray-500 dark:text-gray-400 font-semibold bg-gray-50 dark:bg-gray-900/30 border-b border-gray-200 dark:border-gray-700`}>
                          <span>Subcontractor</span>
                          <span>Project</span>
                          <span className="justify-self-center">Service</span>
                          <span className="justify-self-center">Ordered</span>
                          <span className="justify-self-center">Status</span>
                          <span className="justify-self-center">Alert</span>
                          <span></span>
                        </div>
                        {svcOrders.map((order) => {
                          const sc = subcontractors.find((s) => s.id === order.subcontractorId)
                          return (
                            <OrderRow
                              key={order.id}
                              order={order}
                              showSubcontractor
                              subcontractorName={sc?.name || 'Unknown'}
                              onDelete={() => handleDeleteOrder(order.id)}
                            />
                          )
                        })}
                      </>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </main>
      </div>

      {showAddSubcontractor && (
        <AddSubcontractorModal
          onClose={() => setShowAddSubcontractor(false)}
          onSave={handleAddSubcontractor}
        />
      )}
      {newOrderForSc && (
        <NewOrderModal
          projects={projects}
          subcontractor={newOrderForSc}
          onClose={() => setNewOrderForSc(null)}
          onSave={handleAddOrder}
        />
      )}
      {editingSubcontractor && (
        <EditSubcontractorPanel
          subcontractor={editingSubcontractor}
          onClose={() => setEditingSubcontractor(null)}
          onSave={handleUpdateSubcontractor}
        />
      )}
    </div>
  )
}
