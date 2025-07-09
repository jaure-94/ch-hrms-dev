import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, ArrowRight, Download, Plus } from "lucide-react";
import OnboardingForm from "@/components/onboarding-form";
import PageHeader from "@/components/page-header";

export default function Onboarding() {
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 5;
  
  const steps = [
    "Personal Info",
    "Employment Details", 
    "Contract Info",
    "Manager & Emergency Contact",
    "Review & Submit"
  ];

  const progress = (currentStep / totalSteps) * 100;

  return (
    <div className="flex flex-col h-full">
      <PageHeader 
        title="Employee Onboarding"
        description="Add new employees to your organization"
      >
        <Button variant="outline">
          <Download className="w-4 h-4 mr-2" />
          Export Data
        </Button>
      </PageHeader>

      {/* Main Content */}
      <main className="flex-1 p-6">
        <div className="max-w-4xl mx-auto">
          {/* Progress Bar */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium text-gray-900">
                Step {currentStep} of {totalSteps}
              </span>
              <span className="text-sm text-gray-500">
                {Math.round(progress)}% Complete
              </span>
            </div>
            <Progress value={progress} className="h-2" />
            <div className="flex justify-between mt-2">
              {steps.map((step, index) => (
                <span
                  key={step}
                  className={`text-xs ${
                    index + 1 <= currentStep
                      ? index + 1 === currentStep 
                        ? "text-blue-600 font-medium"
                        : "text-gray-900"
                      : "text-gray-400"
                  }`}
                >
                  {step}
                </span>
              ))}
            </div>
          </div>

          {/* Form Card */}
          <Card className="bg-white shadow-md border border-gray-200">
            <CardHeader>
              <CardTitle className="text-xl">{steps[currentStep - 1]}</CardTitle>
            </CardHeader>
            <CardContent className="p-8">
              <OnboardingForm 
                currentStep={currentStep}
                onStepChange={setCurrentStep}
                totalSteps={totalSteps}
              />
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
