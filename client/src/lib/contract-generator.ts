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
    // Get the active template from localStorage
    const savedTemplates = localStorage.getItem('contractTemplates');
    let activeTemplate = null;
    
    if (savedTemplates) {
      const templates = JSON.parse(savedTemplates);
      activeTemplate = templates.find((t: any) => t.isActive);
    }

    if (!activeTemplate || !activeTemplate.fileContent) {
      throw new Error('No active contract template found. Please upload a template first.');
    }

    const response = await fetch(`/api/employees/${employeeId}/contract`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({
        templateId: activeTemplate.id,
        templateContent: activeTemplate.fileContent,
        templateName: activeTemplate.name,
      }),
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Failed to generate contract' }));
      throw new Error(errorData.message || 'Failed to generate contract');
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
