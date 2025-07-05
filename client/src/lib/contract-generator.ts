export interface ContractData {
  employee: {
    firstName: string;
    lastName: string;
    email: string;
    address?: string;
  };
  employment: {
    jobTitle: string;
    department: string;
    manager?: string;
    baseSalary: string;
    payFrequency: string;
    startDate: string;
    location: string;
    benefits?: string[];
  };
  company: {
    name: string;
    address?: string;
  };
}

export const downloadContract = async (employeeId: string) => {
  try {
    const response = await fetch(`/api/employees/${employeeId}/contract`, {
      method: 'POST',
      credentials: 'include',
    });
    
    if (!response.ok) {
      throw new Error('Failed to generate contract');
    }
    
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `employment_contract_${employeeId}.docx`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  } catch (error) {
    console.error('Error downloading contract:', error);
    throw error;
  }
};
