// Default seed data for Calibration Monitoring System
window.CalibData = {
  INITIAL_AGENCIES: [
    {
      id: "AGN-001",
      name: "Precision Metrology Services",
      code: "PMS-LAB",
      contactPerson: "Dr. Robert Vance",
      email: "r.vance@precisionmetrology.com",
      phone: "+1 (555) 234-8901",
      address: "450 Industrial Parkway, Suite 10, Chicago, IL",
      accreditation: "ISO/IEC 17025 Accredited",
      status: "Active",
      avgTurnaroundDays: 3
    },
    {
      id: "AGN-002",
      name: "NIST Calibration & Standards Lab",
      code: "NIST-CSL",
      contactPerson: "Sarah Jenkins",
      email: "s.jenkins@nist-standards.org",
      phone: "+1 (555) 876-5432",
      address: "100 Science Boulevard, Gaithersburg, MD",
      accreditation: "National Standards Body / ISO 17025",
      status: "Active",
      avgTurnaroundDays: 5
    },
    {
      id: "AGN-003",
      name: "Apex Instruments Calibration Inc.",
      code: "APEX-CAL",
      contactPerson: "Michael Chang",
      email: "mchang@apexcal.com",
      phone: "+1 (555) 345-6789",
      address: "880 Tech Drive, Austin, TX",
      accreditation: "ISO/IEC 17025 Accredited",
      status: "Active",
      avgTurnaroundDays: 2
    },
    {
      id: "AGN-004",
      name: "In-House Quality Metrology Dept",
      code: "INT-MET",
      contactPerson: "Alex Rivera",
      email: "metrology@internal-plant.com",
      phone: "Ext: 4402 (Building B)",
      address: "Plant B - Room 104 Metrology Lab",
      accreditation: "Internal Quality Management System",
      status: "Active",
      avgTurnaroundDays: 1
    }
  ],

  INITIAL_USERS: [
    {
      id: "USR-000",
      name: "Mukunda",
      username: "Mukunda",
      password: "Tejas",
      email: "mukunda@company.com",
      role: "Admin",
      department: "Quality Assurance & Metrology Head",
      avatar: "MK",
      assignedAgencyId: null
    },
    {
      id: "USR-001",
      name: "Marcus Vance",
      username: "admin",
      password: "admin123",
      email: "marcus.vance@company.com",
      role: "Admin",
      department: "Quality Assurance Management",
      avatar: "MV",
      assignedAgencyId: null
    },
    {
      id: "USR-002",
      name: "Elena Rostova",
      username: "elena",
      password: "elena123",
      email: "elena.rostova@company.com",
      role: "Technician",
      department: "Metrology & Quality Control",
      avatar: "ER",
      assignedAgencyId: null
    },
    {
      id: "USR-003",
      name: "David Miller",
      username: "david",
      password: "david123",
      email: "d.miller@precisionmetrology.com",
      role: "AgencyRep",
      department: "External Calibration Specialist",
      avatar: "DM",
      assignedAgencyId: "AGN-001"
    },
    {
      id: "USR-004",
      name: "Priya Sharma",
      username: "priya",
      password: "priya123",
      email: "p.sharma@company.com",
      role: "Auditor",
      department: "Compliance & Safety Audit",
      avatar: "PS",
      assignedAgencyId: null
    }
  ],

  INITIAL_INSTRUMENTS: [
    {
      id: "INS-001",
      tagId: "EQ-CAL-001",
      name: "Digital Vernier Caliper 0-150mm",
      category: "Dimensional",
      manufacturer: "Mitutoyo",
      model: "500-196-30",
      serialNo: "MT-8849201",
      location: "Machining Shop - Bay 2",
      frequencyMonths: 6,
      lastCalibratedDate: "2026-01-22",
      nextDueDate: "2026-07-22",
      agencyId: "AGN-001",
      assignedUser: "Elena Rostova",
      tolerance: "±0.02 mm",
      status: "Active",
      criticality: "High"
    },
    {
      id: "INS-002",
      tagId: "EQ-MIC-002",
      name: "Outside Digital Micrometer 0-25mm",
      category: "Dimensional",
      manufacturer: "Starrett",
      model: "733.1XFL-1",
      serialNo: "ST-7739102",
      location: "Precision Grinding Line",
      frequencyMonths: 6,
      lastCalibratedDate: "2026-01-20",
      nextDueDate: "2026-07-20",
      agencyId: "AGN-002",
      assignedUser: "Elena Rostova",
      tolerance: "±0.001 mm",
      status: "Active",
      criticality: "High"
    },
    {
      id: "INS-003",
      tagId: "EQ-PRS-003",
      name: "Digital Master Pressure Gauge 0-100 PSI",
      category: "Pressure",
      manufacturer: "Fluke Calibration",
      model: "700G08",
      serialNo: "FK-992314",
      location: "Hydraulics Test Bench",
      frequencyMonths: 12,
      lastCalibratedDate: "2025-07-10",
      nextDueDate: "2026-07-10",
      agencyId: "AGN-003",
      assignedUser: "Mukunda",
      tolerance: "±0.05% FS",
      status: "Out of Calibration",
      criticality: "Critical"
    },
    {
      id: "INS-004",
      tagId: "EQ-TRQ-004",
      name: "Adjustable Torque Wrench 10-100 Nm",
      category: "Torque & Force",
      manufacturer: "Snap-on",
      model: "ATECH2FR100B",
      serialNo: "SO-441029",
      location: "Final Assembly Station 4",
      frequencyMonths: 6,
      lastCalibratedDate: "2026-01-24",
      nextDueDate: "2026-07-24",
      agencyId: "AGN-001",
      assignedUser: "Elena Rostova",
      tolerance: "±2% CW",
      status: "Active",
      criticality: "High"
    },
    {
      id: "INS-005",
      tagId: "EQ-TMP-005",
      name: "Dual Input Thermocouple Temperature Calibrator",
      category: "Thermal",
      manufacturer: "Omega Engineering",
      model: "CL3512A",
      serialNo: "OE-112049",
      location: "Heat Treatment Dept",
      frequencyMonths: 12,
      lastCalibratedDate: "2025-08-15",
      nextDueDate: "2026-08-15",
      agencyId: "AGN-004",
      assignedUser: "Alex Rivera",
      tolerance: "±0.1°C",
      status: "Active",
      criticality: "Medium"
    }
  ],

  INITIAL_LOGS: [
    {
      id: "LOG-101",
      instrumentId: "INS-001",
      calibrationDate: "2026-01-22",
      nextDueDate: "2026-07-22",
      agencyId: "AGN-001",
      agencyName: "Precision Metrology Services",
      performedBy: "Dr. Robert Vance",
      certificateNo: "CERT-2026-99102",
      result: "Passed",
      notes: "All gauge blocks calibrated within allowable error limits."
    }
  ]
};
