import { SalesData, WorkflowStatus, SalesPlanEntry } from '../types';

// Local storage service for managing sales data
export class LocalStorageService {
  private static STORAGE_KEY = 'ikea_sales_planning_data';

  // Save a sales plan entry
  static saveSalesPlan(salesData: SalesData, status: WorkflowStatus): string {
    const entries = this.getAllSalesPlans();
    const id = Date.now().toString();
    
    const newEntry: SalesPlanEntry = {
      id,
      ...salesData,
      status,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    entries.push(newEntry);
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(entries));
    return id;
  }

  // Get all sales plan entries
  static getAllSalesPlans(): SalesPlanEntry[] {
    const data = localStorage.getItem(this.STORAGE_KEY);
    if (!data) return [];
    
    try {
      const parsed = JSON.parse(data);
      // Convert date strings back to Date objects
      return parsed.map((entry: any) => ({
        ...entry,
        createdAt: new Date(entry.createdAt),
        updatedAt: new Date(entry.updatedAt)
      }));
    } catch (error) {
      console.error('Error parsing sales data from localStorage:', error);
      return [];
    }
  }

  // Get a specific sales plan by ID
  static getSalesPlanById(id: string): SalesPlanEntry | null {
    const entries = this.getAllSalesPlans();
    return entries.find(entry => entry.id === id) || null;
  }

  // Update an existing sales plan
  static updateSalesPlan(id: string, salesData: SalesData, status: WorkflowStatus): boolean {
    const entries = this.getAllSalesPlans();
    const index = entries.findIndex(entry => entry.id === id);
    
    if (index === -1) return false;

    entries[index] = {
      ...entries[index],
      ...salesData,
      status,
      updatedAt: new Date()
    };

    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(entries));
    return true;
  }

  // Delete a sales plan
  static deleteSalesPlan(id: string): boolean {
    const entries = this.getAllSalesPlans();
    const filteredEntries = entries.filter(entry => entry.id !== id);
    
    if (filteredEntries.length === entries.length) return false;

    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(filteredEntries));
    return true;
  }

  // Get sales plans by status
  static getSalesPlansByStatus(status: WorkflowStatus): SalesPlanEntry[] {
    const entries = this.getAllSalesPlans();
    return entries.filter(entry => entry.status === status);
  }

  // Get sales plans by country
  static getSalesPlansByCountry(country: string): SalesPlanEntry[] {
    const entries = this.getAllSalesPlans();
    return entries.filter(entry => entry.country === country);
  }

  // Clear all data (useful for testing)
  static clearAllData(): void {
    localStorage.removeItem(this.STORAGE_KEY);
  }

  // Export data as JSON
  static exportData(): string {
    const entries = this.getAllSalesPlans();
    return JSON.stringify(entries, null, 2);
  }

  // Import data from JSON
  static importData(jsonData: string): boolean {
    try {
      const entries = JSON.parse(jsonData);
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(entries));
      return true;
    } catch (error) {
      console.error('Error importing data:', error);
      return false;
    }
  }
}