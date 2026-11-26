import { api } from './api'
import { diffDays, daysUntil, formatKm, todayISO } from './format'
import { ALL_END, ALL_START, buildBuckets, type Bucket, type Period } from './period'

export interface Vehicle {
  id: string
  plate: string
  brand?: string | null
  model?: string | null
  year?: number | null
  color?: string | null
  mileage_km: number
  status: string
  notes?: string | null
  renavam?: string | null
  chassis?: string | null
  licensing_due?: string | null
  ipva_due?: string | null
  insurer?: string | null
  insurance_due?: string | null
  purchase_date?: string | null
  purchase_value?: number | null
}

export interface Driver {
  id: string
  full_name: string
  cpf?: string | null
  phone?: string | null
  cnh_number?: string | null
  cnh_category?: string | null
  cnh_expiration?: string | null
  status: string
  notes?: string | null
  photo_path?: string | null
  rg?: string | null
  birth_date?: string | null
  address?: string | null
  emergency_name?: string | null
  emergency_phone?: string | null
}

export interface Contract {
  id: string
  vehicle_id: string
  driver_id: string
  start_date: string
  end_date?: string | null
  weekly_value: number
  due_weekday: number
  status: string
  notes?: string | null
}

export interface Charge {
  id: string
  contract_id: string
  reference_date: string
  due_date: string
  amount: number
  status: string
  paid_at?: string | null
  notes?: string | null
}

export interface Maintenance {
  id: string
  vehicle_id: string
  type: string
  scheduled_date?: string | null
  /** Revisão marcada por quilometragem em vez de data. */
  scheduled_km?: number | null
  completed_date?: string | null
  mileage_km?: number | null
  cost?: number | null
  status: string
  notes?: string | null
}

/** Gasto lançado: seguro, IPVA, financiamento, multa... */
export interface Expense {
  id: string
  vehicle_id?: string | null
  recurring_id?: string | null
  category: string
  description?: string | null
  amount: number
  date: string
  status: string
  paid_at?: string | null
  notes?: string | null
}

/** Gasto fixo que se repete todo mês, como o seguro. */
export interface RecurringExpense {
  id: string
  vehicle_id?: string | null
  category: string
  description?: string | null
  amount: number
  day_of_month: number
  start_date: string
  end_date?: string | null
  status: string
  notes?: string | null
}

export interface Fleet {
  vehicles: Vehicle[]
  drivers: Driver[]
  contracts: Contract[]
  charges: Charge[]
  maintenances: Maintenance[]
  expenses: Expense[]
  recurring: RecurringExpense[]
}

export async function loadFleet(): Promise<Fleet> {
  const [vehicles, drivers, contracts, charges, maintenances, expenses, recurring] = await Promise.all([
    api.get('/vehicles'),
    api.get('/drivers'),
    api.get('/contracts'),
    api.get('/financial-charges'),
    api.get('/maintenances'),
    // Quem ainda não rodou db/gastos.sql continua usando o app normalmente.
    api.get('/expenses').catch(() => []),
    api.get('/recurring-expenses').catch(() => []),
  ])
  return { vehicles, drivers, contracts, charges, maintenances, expenses, recurring }
}

// ---------- vínculos ----------

export function activeContractForVehicle(contracts: Contract[], vehicleId: string) {
  return contracts.find((c) => c.vehicle_id === vehicleId && c.status === 'ativo')
}

export function activeContractForDriver(contracts: Contract[], driverId: string) {
  return contracts.find((c) => c.driver_id === driverId && c.status === 'ativo')
}

export function vehicleById(vehicles: Vehicle[], id?: string | null) {
  return vehicles.find((v) => v.id === id)
}

export function driverById(drivers: Driver[], id?: string | null) {
  return drivers.find((d) => d.id === id)
}

export function plateOf(vehicles: Vehicle[], id?: string | null) {
  return vehicleById(vehicles, id)?.plate || '—'
}

export function driverNameOf(drivers: Driver[], id?: string | null) {
  return driverById(drivers, id)?.full_name || '—'
}

export function vehicleLabel(vehicle?: Vehicle | null) {
  if (!vehicle) return '—'
  const model = [vehicle.brand, vehicle.model].filter(Boolean).join(' ')
  return model ? `${vehicle.plate} · ${model}` : vehicle.plate
}

/** Veículos que não estão gerando receita (sem contrato ativo). */
export function idleVehicles(vehicles: Vehicle[], contracts: Contract[]) {
  return vehicles.filter(
    (v) => v.status !== 'inativo' && !activeContractForVehicle(contracts, v.id),
  )
}

export function driversWithoutVehicle(drivers: Driver[], contracts: Contract[]) {
  return drivers.filter((d) => d.status === 'ativo' && !activeContractForDriver(contracts, d.id))
}

// ---------- dinheiro ----------

export interface Balance {
  total: number
  received: number
  open: number
  overdue: number
  overdueCount: number
  openCount: number
  paidCount: number
  nextDue?: Charge
}

export function balanceOf(charges: Charge[]): Balance {
  const today = todayISO()
  const paid = charges.filter((c) => c.status === 'pago')
  const open = charges.filter((c) => c.status !== 'pago' && c.status !== 'cancelado')
  const overdue = open.filter((c) => c.due_date < today)
  const upcoming = open
    .filter((c) => c.due_date >= today)
    .sort((a, b) => a.due_date.localeCompare(b.due_date))

  const sum = (list: Charge[]) => list.reduce((acc, c) => acc + Number(c.amount || 0), 0)

  return {
    total: sum(charges.filter((c) => c.status !== 'cancelado')),
    received: sum(paid),
    open: sum(open),
    overdue: sum(overdue),
    overdueCount: overdue.length,
    openCount: open.length,
    paidCount: paid.length,
    nextDue: upcoming[0],
  }
}

export function chargesOfContract(charges: Charge[], contractId: string) {
  return charges
    .filter((c) => c.contract_id === contractId)
    .sort((a, b) => b.due_date.localeCompare(a.due_date))
}

export function chargesOfVehicle(charges: Charge[], contracts: Contract[], vehicleId: string) {
  const ids = new Set(contracts.filter((c) => c.vehicle_id === vehicleId).map((c) => c.id))
  return charges.filter((c) => ids.has(c.contract_id)).sort((a, b) => b.due_date.localeCompare(a.due_date))
}

export function chargesOfDriver(charges: Charge[], contracts: Contract[], driverId: string) {
  const ids = new Set(contracts.filter((c) => c.driver_id === driverId).map((c) => c.id))
  return charges.filter((c) => ids.has(c.contract_id)).sort((a, b) => b.due_date.localeCompare(a.due_date))
}

export function isOverdue(charge: Charge) {
  return charge.status !== 'pago' && charge.status !== 'cancelado' && charge.due_date < todayISO()
}

export function chargeStatus(charge: Charge) {
  if (charge.status === 'pago') return 'pago'
  if (charge.status === 'cancelado') return 'cancelado'
  return isOverdue(charge) ? 'atrasado' : 'pendente'
}

/** Dia em que o dinheiro entrou, em ISO (a hora não interessa). */
export function paidDateOf(charge: Charge) {
  return charge.paid_at ? charge.paid_at.slice(0, 10) : null
}

/** Converte a data escolhida na tela no timestamp que vai para o banco. */
export function timestampFromDate(dateISO: string) {
  return new Date(`${dateISO}T12:00:00`).toISOString()
}

/** Dias entre o vencimento e o recebimento. 0 = pagou em dia ou adiantado. */
export function paymentDelay(charge: Charge) {
  const paidDate = paidDateOf(charge)
  if (charge.status !== 'pago' || !paidDate) return null
  return Math.max(0, diffDays(charge.due_date, paidDate))
}

/** % de pagamentos quitados até o vencimento — reputação do motorista. */
export function punctuality(charges: Charge[]) {
  const settled = charges.filter((c) => c.status === 'pago')
  if (settled.length === 0) return null
  const onTime = settled.filter((c) => (paymentDelay(c) ?? 0) === 0)
  return Math.round((onTime.length / settled.length) * 100)
}

export function maintenanceCost(maintenances: Maintenance[], vehicleId?: string) {
  return maintenances
    .filter((m) => (vehicleId ? m.vehicle_id === vehicleId : true) && m.status !== 'cancelada')
    .reduce((acc, m) => acc + Number(m.cost || 0), 0)
}

// ---------- período ----------

export interface DateRange {
  start: string
  end: string
}

export function chargesInPeriod(charges: Charge[], period: DateRange) {
  return charges.filter((c) => c.due_date >= period.start && c.due_date <= period.end)
}

/** Manutenções pela data em que aconteceram (ou estão agendadas). */
export function maintenancesInPeriod(maintenances: Maintenance[], period: DateRange, vehicleId?: string) {
  return maintenances.filter((m) => {
    if (m.status === 'cancelada') return false
    if (vehicleId && m.vehicle_id !== vehicleId) return false
    const date = m.completed_date || m.scheduled_date
    return Boolean(date && date >= period.start && date <= period.end)
  })
}

export interface SeriesPoint extends Bucket {
  received: number
  open: number
  total: number
  /** Tudo que saiu do caixa na fatia: despesas + manutenção. */
  expense: number
  /** Recebido menos o que saiu. */
  net: number
}

/** Uma saída de caixa qualquer, só com o que o gráfico precisa saber. */
export interface CostEntry {
  date: string
  amount: number
}

/**
 * Colunas do gráfico. O que já foi recebido aparece no dia em que o dinheiro
 * entrou, e não no vencimento — senão um pagamento adiantado apareceria como
 * "recebido" numa semana que ainda nem chegou. O que está em aberto continua
 * no vencimento, que é quando ele deveria entrar.
 */
export function chargeSeries(charges: Charge[], period: Period, costs: CostEntry[] = []): SeriesPoint[] {
  const inPeriod = chargesInPeriod(charges, period).filter((c) => c.status !== 'cancelado')
  if (inPeriod.length === 0 && costs.length === 0) return []

  // Em "Tudo" o intervalo é aberto: usamos as pontas dos próprios dados.
  const dates = [...inPeriod.map((c) => c.due_date), ...costs.map((c) => c.date)].sort()
  const start = period.start === ALL_START ? dates[0] : period.start
  const end = period.end === ALL_END ? dates[dates.length - 1] : period.end

  const points: SeriesPoint[] = buildBuckets(start, end).map((bucket) => ({
    ...bucket,
    received: 0,
    open: 0,
    total: 0,
    expense: 0,
    net: 0,
  }))
  if (points.length === 0) return []

  // Pagamento feito fora da janela do gráfico entra na coluna da ponta, para o
  // total das colunas continuar batendo com o resumo do período.
  const bucketFor = (date: string) => {
    const index = points.findIndex((point) => date >= point.start && date <= point.end)
    if (index >= 0) return points[index]
    return date < points[0].start ? points[0] : points[points.length - 1]
  }

  for (const charge of inPeriod) {
    const amount = Number(charge.amount || 0)
    const paidDate = paidDateOf(charge)
    if (charge.status === 'pago') {
      bucketFor(paidDate || charge.due_date).received += amount
    } else {
      bucketFor(charge.due_date).open += amount
    }
  }

  for (const cost of costs) {
    bucketFor(cost.date).expense += Number(cost.amount || 0)
  }

  return points.map((point) => ({
    ...point,
    total: point.received + point.open,
    net: point.received - point.expense,
  }))
}

export interface VehicleResult {
  vehicle: Vehicle
  received: number
  open: number
  /** Custo de manutenção no período. */
  maintenance: number
  /** Despesas lançadas no período (seguro, IPVA, multa...). */
  expenses: number
  /** Manutenção + despesas. */
  cost: number
  net: number
  driver?: Driver
}

/** Resultado por veículo no período: recebido menos tudo que ele custou. */
export function vehicleResults(fleet: Fleet, period: DateRange): VehicleResult[] {
  return fleet.vehicles
    .map((vehicle) => {
      const charges = chargesInPeriod(chargesOfVehicle(fleet.charges, fleet.contracts, vehicle.id), period)
      const balance = balanceOf(charges)
      const maintenance = maintenancesInPeriod(fleet.maintenances, period, vehicle.id).reduce(
        (acc, m) => acc + Number(m.cost || 0),
        0,
      )
      const expenses = fleet.expenses
        .filter((e) => e.vehicle_id === vehicle.id && e.date >= period.start && e.date <= period.end)
        .reduce((acc, e) => acc + Number(e.amount || 0), 0)
      const contract = activeContractForVehicle(fleet.contracts, vehicle.id)
      return {
        vehicle,
        received: balance.received,
        open: balance.open,
        maintenance,
        expenses,
        cost: maintenance + expenses,
        net: balance.received - maintenance - expenses,
        driver: driverById(fleet.drivers, contract?.driver_id),
      }
    })
    .sort((a, b) => b.net - a.net)
}

export interface DriverResult {
  driver: Driver
  vehicle?: Vehicle
  received: number
  open: number
  overdue: number
  paidCount: number
  openCount: number
  punctuality: number | null
}

/** Quem pagou e quem está devendo no período. */
export function driverResults(fleet: Fleet, period: DateRange): DriverResult[] {
  return fleet.drivers
    .map((driver) => {
      const charges = chargesInPeriod(chargesOfDriver(fleet.charges, fleet.contracts, driver.id), period)
      const balance = balanceOf(charges)
      const contract = activeContractForDriver(fleet.contracts, driver.id)
      return {
        driver,
        vehicle: vehicleById(fleet.vehicles, contract?.vehicle_id),
        received: balance.received,
        open: balance.open,
        overdue: balance.overdue,
        paidCount: balance.paidCount,
        openCount: balance.openCount,
        punctuality: punctuality(charges),
      }
    })
    .filter((row) => row.received > 0 || row.open > 0)
    .sort((a, b) => b.received - a.received)
}

// ---------- alertas ----------

export type AlertLevel = 'danger' | 'warning' | 'info'

export interface DeadlineAlert {
  label: string
  date: string
  days: number
  level: AlertLevel
}

function levelFor(days: number, warningWindow: number): AlertLevel {
  if (days < 0) return 'danger'
  return days <= warningWindow ? 'warning' : 'info'
}

/** Documentos do veículo com prazo (licenciamento, IPVA, seguro). */
export function vehicleDeadlines(vehicle: Vehicle, warningWindow = 30): DeadlineAlert[] {
  const raw: { label: string; date?: string | null }[] = [
    { label: 'Licenciamento', date: vehicle.licensing_due },
    { label: 'IPVA', date: vehicle.ipva_due },
    { label: 'Seguro', date: vehicle.insurance_due },
  ]
  return raw
    .filter((item): item is { label: string; date: string } => Boolean(item.date))
    .map((item) => {
      const days = daysUntil(item.date) ?? 0
      return { label: item.label, date: item.date, days, level: levelFor(days, warningWindow) }
    })
    .sort((a, b) => a.days - b.days)
}

/** A partir de quantos km antes a revisão por quilometragem começa a avisar. */
export const kmWarningWindow = 1000

export interface MaintenanceKm {
  target: number
  current: number
  /** Quanto ainda falta rodar; negativo significa que já passou. */
  remaining: number
}

/** Situação de uma revisão marcada por quilometragem. */
export function maintenanceKm(maintenance: Maintenance, vehicle?: Vehicle): MaintenanceKm | null {
  const target = Number(maintenance.scheduled_km || 0)
  if (!target || !vehicle) return null
  const current = Number(vehicle.mileage_km || 0)
  return { target, current, remaining: target - current }
}

export function cnhDeadline(driver: Driver, warningWindow = 30): DeadlineAlert | null {
  if (!driver.cnh_expiration) return null
  const days = daysUntil(driver.cnh_expiration) ?? 0
  return {
    label: 'CNH',
    date: driver.cnh_expiration,
    days,
    level: levelFor(days, warningWindow),
  }
}

export interface FleetAlert {
  id: string
  kind: 'cobranca' | 'cnh' | 'documento' | 'manutencao' | 'ocioso'
  level: AlertLevel
  title: string
  detail: string
  to?: string
  order: number
}

/**
 * Tudo que precisa da atenção do dono, em uma lista só, do mais urgente
 * para o menos urgente.
 */
export function fleetAlerts(fleet: Fleet, warningWindow = 30): FleetAlert[] {
  const alerts: FleetAlert[] = []

  for (const charge of fleet.charges) {
    if (!isOverdue(charge)) continue
    const contract = fleet.contracts.find((c) => c.id === charge.contract_id)
    const driver = driverById(fleet.drivers, contract?.driver_id)
    const days = Math.abs(daysUntil(charge.due_date) ?? 0)
    alerts.push({
      id: `charge-${charge.id}`,
      kind: 'cobranca',
      level: 'danger',
      title: `${driver?.full_name || 'Motorista'} · ${plateOf(fleet.vehicles, contract?.vehicle_id)}`,
      detail: `Pagamento atrasado há ${days} ${days === 1 ? 'dia' : 'dias'}`,
      to: contract ? `/app/contratos/${contract.id}` : '/app/financeiro',
      order: -1000 - days,
    })
  }

  for (const driver of fleet.drivers) {
    if (driver.status !== 'ativo') continue
    const cnh = cnhDeadline(driver, warningWindow)
    if (!cnh || cnh.level === 'info') continue
    alerts.push({
      id: `cnh-${driver.id}`,
      kind: 'cnh',
      level: cnh.level,
      title: `CNH de ${driver.full_name}`,
      detail: cnh.days < 0 ? `Vencida há ${Math.abs(cnh.days)} dias` : `Vence em ${cnh.days} dias`,
      to: `/app/motoristas/${driver.id}`,
      order: cnh.days,
    })
  }

  for (const vehicle of fleet.vehicles) {
    for (const deadline of vehicleDeadlines(vehicle, warningWindow)) {
      if (deadline.level === 'info') continue
      alerts.push({
        id: `doc-${vehicle.id}-${deadline.label}`,
        kind: 'documento',
        level: deadline.level,
        title: `${deadline.label} · ${vehicle.plate}`,
        detail: deadline.days < 0 ? `Vencido há ${Math.abs(deadline.days)} dias` : `Vence em ${deadline.days} dias`,
        to: `/app/veiculos/${vehicle.id}`,
        order: deadline.days,
      })
    }
  }

  for (const m of fleet.maintenances) {
    if (!['pendente', 'agendada'].includes(m.status)) continue

    const km = maintenanceKm(m, vehicleById(fleet.vehicles, m.vehicle_id))
    if (km && km.remaining <= kmWarningWindow) {
      alerts.push({
        id: `maint-km-${m.id}`,
        kind: 'manutencao',
        level: km.remaining <= 0 ? 'danger' : 'warning',
        title: `${m.type} · ${plateOf(fleet.vehicles, m.vehicle_id)}`,
        detail:
          km.remaining <= 0
            ? `Revisão vencida: já rodou ${formatKm(Math.abs(km.remaining))} além dos ${formatKm(km.target)}`
            : `Faltam ${formatKm(km.remaining)} para os ${formatKm(km.target)}`,
        to: `/app/veiculos/${m.vehicle_id}`,
        // Quilômetro faltando entra na mesma escala de urgência dos dias.
        order: Math.round(km.remaining / 100),
      })
      continue
    }

    if (!m.scheduled_date) continue
    const days = daysUntil(m.scheduled_date) ?? 0
    if (days > 7) continue
    alerts.push({
      id: `maint-${m.id}`,
      kind: 'manutencao',
      level: days < 0 ? 'danger' : 'warning',
      title: `${m.type} · ${plateOf(fleet.vehicles, m.vehicle_id)}`,
      detail: days < 0 ? `Atrasada há ${Math.abs(days)} dias` : days === 0 ? 'Agendada para hoje' : `Em ${days} dias`,
      to: `/app/veiculos/${m.vehicle_id}`,
      order: days,
    })
  }

  for (const vehicle of idleVehicles(fleet.vehicles, fleet.contracts)) {
    alerts.push({
      id: `idle-${vehicle.id}`,
      kind: 'ocioso',
      level: 'warning',
      title: `${vehicle.plate} sem motorista`,
      detail: 'Veículo parado, sem receita semanal',
      to: `/app/veiculos/${vehicle.id}`,
      order: 500,
    })
  }

  return alerts.sort((a, b) => a.order - b.order)
}
