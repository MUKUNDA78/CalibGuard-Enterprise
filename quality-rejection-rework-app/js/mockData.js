// Clear Initial Data - Ready for Fresh User Data Entry & Excel Upload

const STAGES = {
    inprocess: { id: 'inprocess', name: 'Inprocess Inspection', color: '#2563eb', icon: 'fa-cogs' },
    final: { id: 'final', name: 'Final Inspection', color: '#059669', icon: 'fa-clipboard-check' },
    mpi: { id: 'mpi', name: 'MPI (Magnetic Particle)', color: '#dc2626', icon: 'fa-magnet' },
    heat_treatment: { id: 'heat_treatment', name: 'Heat Treatment', color: '#d97706', icon: 'fa-fire' },
    vendor_machining: { id: 'vendor_machining', name: 'Machining Vendor Rejection', color: '#7c3aed', icon: 'fa-industry' },
    customer_return: { id: 'customer_return', name: 'Customer Return', color: '#db2777', icon: 'fa-truck-loading' }
};

// Start with clean empty dataset for user input
const INITIAL_RECORDS = [];
