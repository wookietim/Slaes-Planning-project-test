export interface SalesPlanRow {
  planningPeriod?: string;
  quarter?: string; // Legacy field for backwards compatibility
  hfb?: string; // HFB field
  salesGoal: number;
  actualSales: number;
  variance: number;
  qty?: number; // Quantity field
}

export interface SalesPlan {
  id: string;
  country: string;
  year: string;
  status: string;
  user?: string; // User email who created the plan
  rows: SalesPlanRow[];
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateSalesPlanRequest {
  country: string;
  year: string;
  status: string;
  user?: string; // User email who created the plan
  rows: SalesPlanRow[];
}

export interface UpdateSalesPlanRequest {
  country: string;
  year: string;
  status: string;
  user?: string; // User email who created the plan
  rows: SalesPlanRow[];
}

class ApiService {
  private baseUrl = 'http://localhost:3001/api';

  async getAllSalesPlans(): Promise<SalesPlan[]> {
    const response = await fetch(`${this.baseUrl}/sales-plans`);
    if (!response.ok) {
      throw new Error(`Failed to fetch sales plans: ${response.statusText}`);
    }
    return response.json();
  }

  async getSalesPlanById(id: string): Promise<SalesPlan> {
    const response = await fetch(`${this.baseUrl}/sales-plans/${id}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch sales plan: ${response.statusText}`);
    }
    return response.json();
  }

  async createSalesPlan(salesPlan: CreateSalesPlanRequest): Promise<{ id: string; message: string }> {
    const response = await fetch(`${this.baseUrl}/sales-plans`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(salesPlan),
    });

    if (!response.ok) {
      throw new Error(`Failed to create sales plan: ${response.statusText}`);
    }
    return response.json();
  }

  async updateSalesPlan(id: string, salesPlan: UpdateSalesPlanRequest): Promise<{ message: string }> {
    const response = await fetch(`${this.baseUrl}/sales-plans/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(salesPlan),
    });

    if (!response.ok) {
      throw new Error(`Failed to update sales plan: ${response.statusText}`);
    }
    return response.json();
  }

  async deleteSalesPlan(id: string): Promise<{ message: string }> {
    const response = await fetch(`${this.baseUrl}/sales-plans/${id}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error(`Failed to delete sales plan: ${response.statusText}`);
    }
    return response.json();
  }

  async getSalesPlansByStatus(status: string): Promise<SalesPlan[]> {
    const response = await fetch(`${this.baseUrl}/sales-plans/status/${status}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch sales plans by status: ${response.statusText}`);
    }
    return response.json();
  }

  async clearAllData(): Promise<{ message: string }> {
    const response = await fetch(`${this.baseUrl}/sales-plans`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error(`Failed to clear all data: ${response.statusText}`);
    }
    return response.json();
  }

  async healthCheck(): Promise<{ status: string; message: string }> {
    const response = await fetch(`${this.baseUrl}/health`);
    if (!response.ok) {
      throw new Error(`Health check failed: ${response.statusText}`);
    }
    return response.json();
  }
}

export default new ApiService();