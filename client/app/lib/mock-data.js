export const mockOrders = [
  {
    id: 'ORD-1001',
    patientName: 'Maya Torres',
    phone: '0550 11 22 33',
    productName: 'Amoxicillin 500mg',
    status: 'Not Yet',
    urgency: 'Urgent',
    arrivalDate: '2026-02-17',
    createdAt: '2026-02-16T10:00:00.000Z',
    comments: [
      {
        id: 'c-1001-1',
        author: 'Alex Manager',
        text: 'Supplier promised update before noon.',
        createdAt: '2026-02-16T11:00:00.000Z'
      }
    ]
  },
  {
    id: 'ORD-1002',
    patientName: 'Liam Bennett',
    phone: '0661 22 33 44',
    productName: 'Insulin Glargine',
    status: 'Ordered',
    urgency: 'Urgent',
    arrivalDate: '2026-02-18',
    createdAt: '2026-02-15T09:30:00.000Z',
    comments: []
  },
  {
    id: 'ORD-1003',
    patientName: 'Emma Cooper',
    phone: '0770 33 44 55',
    productName: 'Atorvastatin 20mg',
    status: 'Arrived',
    urgency: 'Normal',
    arrivalDate: '2026-02-19',
    createdAt: '2026-02-14T15:20:00.000Z',
    comments: []
  },
  {
    id: 'ORD-1004',
    patientName: 'Noah Reed',
    phone: '0550 44 55 66',
    productName: 'Levothyroxine 50mcg',
    status: 'Not Yet',
    urgency: 'Normal',
    arrivalDate: '2026-02-20',
    createdAt: '2026-02-16T18:00:00.000Z',
    comments: []
  },
  {
    id: 'ORD-1005',
    patientName: 'Sofia Hall',
    phone: '0661 55 66 77',
    productName: 'Metformin 850mg',
    status: 'Ordered',
    urgency: 'Normal',
    arrivalDate: '2026-02-20',
    createdAt: '2026-02-13T12:00:00.000Z',
    comments: []
  }
]

export const mockWorkers = [
  { id: 1, name: 'Nina Brooks', role: 'Worker', email: 'nina@pharmacy.local' },
  { id: 2, name: 'Ian Ross', role: 'Worker', email: 'ian@pharmacy.local' },
  { id: 3, name: 'Sara Kim', role: 'Worker', email: 'sara@pharmacy.local' }
]
