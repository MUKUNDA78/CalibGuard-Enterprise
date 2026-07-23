// Data persistence helper (Clean Empty Dataset for User Entry)

const STORAGE_KEY = 'quality_inspection_records_v3';

class QualityDataStore {
    constructor() {
        this.records = this.loadRecords();
    }

    loadRecords() {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) {
                return JSON.parse(stored);
            }
        } catch (e) {
            console.error('Error reading localStorage:', e);
        }
        this.saveRecords([]);
        return [];
    }

    saveRecords(data) {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
            this.records = data;
        } catch (e) {
            console.error('Error saving to localStorage:', e);
        }
    }

    clearAllRecords() {
        localStorage.removeItem(STORAGE_KEY);
        this.records = [];
        this.saveRecords(this.records);
        return this.records;
    }

    resetToDefault() {
        return this.clearAllRecords();
    }

    getAllRecords() {
        return this.records;
    }

    addRecord(newRecord) {
        if (!newRecord.id) {
            const maxNum = this.records.reduce((max, r) => {
                const match = r.id ? r.id.match(/QR-2026-(\d+)/) : null;
                return match ? Math.max(max, parseInt(match[1], 10)) : max;
            }, 0);
            const nextId = String(maxNum + 1).padStart(3, '0');
            newRecord.id = `QR-2026-${nextId}`;
        }

        if (STAGES[newRecord.stage]) {
            newRecord.stageLabel = STAGES[newRecord.stage].name;
        }

        this.records.unshift(newRecord);
        this.saveRecords(this.records);
        return newRecord;
    }

    importRecords(importedList) {
        let addedCount = 0;
        importedList.forEach(item => {
            if (item.partNo && (item.productionQty !== undefined || item.rejectionQty !== undefined)) {
                this.addRecord(item);
                addedCount++;
            }
        });
        return addedCount;
    }

    updateRecord(id, updatedFields) {
        const index = this.records.findIndex(r => r.id === id);
        if (index !== -1) {
            this.records[index] = { ...this.records[index], ...updatedFields };
            this.saveRecords(this.records);
            return this.records[index];
        }
        return null;
    }

    deleteRecord(id) {
        this.records = this.records.filter(r => r.id !== id);
        this.saveRecords(this.records);
    }

    getSummaryMetrics(filteredRecords) {
        const records = filteredRecords || this.records;

        let totalProductionQty = 0;
        let totalAcceptedQty = 0;
        let totalRejectionQty = 0;
        let totalReworkQty = 0;

        records.forEach(r => {
            totalProductionQty += Number(r.productionQty || 0);
            totalAcceptedQty += Number(r.acceptedQty || 0);
            totalRejectionQty += Number(r.rejectionQty || 0);
            totalReworkQty += Number(r.reworkQty || 0);
        });

        const overallRejectionRate = totalProductionQty > 0 
            ? ((totalRejectionQty / totalProductionQty) * 100).toFixed(2) 
            : '0.00';

        const overallReworkRate = totalProductionQty > 0 
            ? ((totalReworkQty / totalProductionQty) * 100).toFixed(2) 
            : '0.00';

        const firstPassYield = totalProductionQty > 0 
            ? ((totalAcceptedQty / totalProductionQty) * 100).toFixed(2) 
            : '0.00';

        return {
            totalProductionQty,
            totalAcceptedQty,
            totalRejectionQty,
            totalReworkQty,
            overallRejectionRate,
            overallReworkRate,
            firstPassYield,
            totalRecords: records.length
        };
    }
}

const dataStore = new QualityDataStore();
